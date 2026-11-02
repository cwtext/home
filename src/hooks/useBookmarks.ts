import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { readLocalBookmarks, toggled, writeLocalBookmarks, type Bookmark } from '@/lib/bookmarks';

const LOCAL = ['bookmarks', 'local'];

/**
 * The reader's bookmarked paragraphs, newest first. Signed-in readers keep
 * them in their account; anyone else keeps them in this browser. Bookmarks
 * made while signed out move into the account on signing in.
 */
export function useBookmarks(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const local = useQuery({
    queryKey: LOCAL,
    queryFn: () => readLocalBookmarks(),
    staleTime: Infinity,
  });

  const remote = useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: async () => {
      const { data, error } = await supabase!
        .from('bookmarks')
        .select('note_slug, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Bookmark[];
    },
    enabled: !!supabase && !!userId,
    retry: false,
  });

  // Until the account's bookmarks can be reached (e.g. before bookmarks.sql is run), use this browser's
  const inAccount = !!userId && remote.isSuccess;

  // Move this browser's bookmarks into the account, once
  const moving = useRef(false);
  useEffect(() => {
    const pending = local.data ?? [];
    if (!inAccount || pending.length === 0 || moving.current) return;
    moving.current = true;
    supabase!
      .from('bookmarks')
      .upsert(pending.map((b) => ({ note_slug: b.note_slug, created_at: b.created_at })), {
        onConflict: 'user_id,note_slug',
        ignoreDuplicates: true,
      })
      .then(({ error }) => {
        moving.current = false;
        if (error) return console.warn('Could not move bookmarks into the account', error);
        writeLocalBookmarks([]);
        queryClient.setQueryData(LOCAL, []);
        queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] });
      });
  }, [inAccount, local.data, userId, queryClient]);

  const bookmarks = useMemo(() => {
    const list = inAccount ? remote.data ?? [] : local.data ?? [];
    return [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [inAccount, remote.data, local.data]);

  const slugs = useMemo(() => new Set(bookmarks.map((b) => b.note_slug)), [bookmarks]);

  const toggle = useMutation({
    mutationFn: async ({ slug, on }: { slug: string; on: boolean }) => {
      if (!inAccount) {
        const next = toggled(readLocalBookmarks(), slug, on);
        writeLocalBookmarks(next);
        queryClient.setQueryData(LOCAL, next);
        return;
      }
      const { error } = on
        ? await supabase!.from('bookmarks').upsert({ note_slug: slug }, { onConflict: 'user_id,note_slug', ignoreDuplicates: true })
        : await supabase!.from('bookmarks').delete().eq('note_slug', slug);
      if (error) throw error;
    },
    // Show the change straight away; put it back if saving fails
    onMutate: ({ slug, on }) => {
      if (!inAccount) return;
      const key = ['bookmarks', userId];
      const before = queryClient.getQueryData<Bookmark[]>(key);
      queryClient.setQueryData<Bookmark[]>(key, toggled(before ?? [], slug, on));
      return { before };
    },
    onError: (err, _vars, context) => {
      toast({ title: 'Could not save the bookmark', description: err.message, variant: 'destructive' });
      if (context?.before) queryClient.setQueryData(['bookmarks', userId], context.before);
    },
    onSettled: () => {
      if (inAccount) queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] });
    },
  });

  const isBookmarked = useCallback((slug: string) => slugs.has(slug), [slugs]);
  const { mutate } = toggle;
  const toggleBookmark = useCallback((slug: string) => mutate({ slug, on: !slugs.has(slug) }), [mutate, slugs]);

  return {
    bookmarks,
    isBookmarked,
    toggleBookmark,
    /** Whether they're saved to the reader's account rather than this browser */
    inAccount,
    isLoading: local.isLoading || (!!userId && remote.isLoading),
  };
}

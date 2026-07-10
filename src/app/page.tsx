import React from 'react';
import { supabase } from '@/lib/supabase';
import VoteClient from '@/components/VoteClient';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q as string | undefined;

  let question = null;
  let initialVotesA = 0;
  let initialVotesB = 0;
  let allQuestionIds: string[] = [];

  try {
    // 1. Fetch all available question IDs from Supabase for navigation
    const { data: allQuestions } = await supabase
      .from('questions')
      .select('id')
      .order('question_no', { ascending: true });
    
    if (allQuestions) {
      allQuestionIds = allQuestions.map((item) => item.id);
    }

    // 2. If a query id is provided, load details and statistics
    if (q) {
      const { data: fetchedQuestion } = await supabase
        .from('questions')
        .select('*')
        .eq('id', q)
        .single();

      if (fetchedQuestion) {
        question = fetchedQuestion;

        // Fetch vote counts in parallel
        const [votesARes, votesBRes] = await Promise.all([
          supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('question_id', q)
            .eq('selected_option', 'A'),
          supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('question_id', q)
            .eq('selected_option', 'B')
        ]);

        initialVotesA = votesARes.count || 0;
        initialVotesB = votesBRes.count || 0;
      }
    }
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
  }

  // 3. Client Redirect trigger setup if no specific question query is present
  // If ?q=UUID is not in the URL, VoteClient's useEffect will check local history
  // and redirect immediately.
  return (
    <VoteClient
      question={question}
      initialVotesA={initialVotesA}
      initialVotesB={initialVotesB}
      allQuestionIds={allQuestionIds}
    />
  );
}

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
  let errorMsg: string | null = null;

  try {
    // 1. Fetch all available question IDs from Supabase for navigation
    const { data: allQuestions, error: allError } = await supabase
      .from('questions')
      .select('id')
      .order('question_no', { ascending: true });
    
    if (allError) {
      errorMsg = `질문 목록 로드 실패: ${allError.message} (코드: ${allError.code})`;
      console.error('Error fetching questions list:', allError);
    } else if (allQuestions) {
      allQuestionIds = allQuestions.map((item) => item.id);
    }

    // 2. If a query id is provided, load details and statistics
    if (q && !errorMsg) {
      const { data: fetchedQuestion, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('id', q)
        .single();

      if (qError) {
        errorMsg = `개별 질문 로드 실패 (?q=${q}): ${qError.message} (코드: ${qError.code})`;
        console.error('Error fetching specific question:', qError);
      } else if (fetchedQuestion) {
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

        if (votesARes.error) {
          console.error('Error fetching votes A:', votesARes.error);
        }
        if (votesBRes.error) {
          console.error('Error fetching votes B:', votesBRes.error);
        }

        initialVotesA = votesARes.count || 0;
        initialVotesB = votesBRes.count || 0;
      }
    }
  } catch (err: any) {
    errorMsg = `서버 데이터 페치 중 치명적 에러: ${err?.message || err}`;
    console.error('Fatal server side error:', err);
  }

  return (
    <VoteClient
      question={question}
      initialVotesA={initialVotesA}
      initialVotesB={initialVotesB}
      allQuestionIds={allQuestionIds}
      serverError={errorMsg}
    />
  );
}

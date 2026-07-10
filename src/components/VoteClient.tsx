'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, ChevronRight, Share2, HelpCircle, Trophy, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import OnboardingModal from './OnboardingModal';
import StatsBottomSheet from './StatsBottomSheet';
import ShareSheet from './ShareSheet';

interface Question {
  id: string;
  question_no: number;
  title: string;
  option_a: string;
  emoji_a: string | null;
  option_b: string;
  emoji_b: string | null;
  category: string | null;
}

interface VoteClientProps {
  question: Question | null;
  initialVotesA: number;
  initialVotesB: number;
  allQuestionIds: string[];
  serverError?: string | null;
}

export default function VoteClient({
  question,
  initialVotesA,
  initialVotesB,
  allQuestionIds,
  serverError
}: VoteClientProps) {
  const [userInfo, setUserInfo] = useState<{ gender: string; age_group: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | null>(null);
  const [votesA, setVotesA] = useState(initialVotesA);
  const [votesB, setVotesB] = useState(initialVotesB);
  const [showStats, setShowStats] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [noMoreQuestions, setNoMoreQuestions] = useState(false);

  // 1. Initial configuration check (Demographics & Voted History)
  useEffect(() => {
    const storedUser = localStorage.getItem('bals_user_info');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    } else {
      setShowOnboarding(true);
    }

    const votedList = JSON.parse(localStorage.getItem('bals_voted_questions') || '[]');
    
    if (question) {
      if (votedList.includes(question.id)) {
        setHasVoted(true);
      }
    } else if (allQuestionIds.length > 0) {
      const unvotedIds = allQuestionIds.filter((id) => !votedList.includes(id));
      
      if (unvotedIds.length > 0) {
        const randomId = unvotedIds[Math.floor(Math.random() * unvotedIds.length)];
        window.location.href = `/?q=${randomId}`;
      } else {
        // All questions completed! Show custom witty screen
        setNoMoreQuestions(true);
      }
    }

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Ads fail gracefully
    }
  }, [question, allQuestionIds]);

  const handleOnboardingComplete = (data: { gender: string; age_group: string }) => {
    localStorage.setItem('bals_user_info', JSON.stringify(data));
    setUserInfo(data);
    setShowOnboarding(false);
  };

  // 2. Zero-Latency Optimistic Voting
  const handleVote = async (option: 'A' | 'B') => {
    if (hasVoted || !question) return;

    setSelectedOption(option);
    setHasVoted(true);

    if (option === 'A') {
      setVotesA((prev) => prev + 1);
    } else {
      setVotesB((prev) => prev + 1);
    }

    const votedList = JSON.parse(localStorage.getItem('bals_voted_questions') || '[]');
    if (!votedList.includes(question.id)) {
      votedList.push(question.id);
      localStorage.setItem('bals_voted_questions', JSON.stringify(votedList));
    }

    const gender = userInfo?.gender || '미선택';
    const ageGroup = userInfo?.age_group || '미선택';

    supabase
      .from('votes')
      .insert({
        question_id: question.id,
        selected_option: option,
        gender: gender,
        age_group: ageGroup
      })
      .then(({ error }) => {
        if (error) {
          console.error('Background vote logging failed:', error);
        }
      });
  };

  // 3. Maximizing PV with window.location.href (Filters already-voted questions strictly)
  const handleNextQuestion = () => {
    if (redirecting) return;
    setRedirecting(true);

    const votedList = JSON.parse(localStorage.getItem('bals_voted_questions') || '[]');
    let unvotedIds = allQuestionIds.filter((id) => !votedList.includes(id));

    if (question) {
      unvotedIds = unvotedIds.filter((id) => id !== question.id);
    }

    if (unvotedIds.length > 0) {
      const nextId = unvotedIds[Math.floor(Math.random() * unvotedIds.length)];
      window.location.href = `/?q=${nextId}`;
    } else {
      // Redirect to root, triggering the no-more-questions screen
      window.location.href = '/';
    }
  };

  // Clear history to let them play again manually
  const handleResetHistory = () => {
    localStorage.removeItem('bals_voted_questions');
    window.location.href = '/';
  };

  // Calculate percentages (1 decimal place)
  const total = votesA + votesB;
  const percentA = total > 0 ? Number(((votesA / total) * 100).toFixed(1)) : 50.0;
  const percentB = total > 0 ? Number((100 - percentA).toFixed(1)) : 50.0;

  // Capped at 30% / 70% to ensure enough vertical spacing for texts, preventing clipping
  const displayGrowA = total > 0 ? Math.max(30, Math.min(70, Math.round((votesA / total) * 100))) : 50;
  const displayGrowB = 100 - displayGrowA;

  if (serverError) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-zinc-950 text-white font-sans p-6 text-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 max-w-sm">
          <span className="text-3xl mb-3 block">⚠️</span>
          <h2 className="text-base font-bold text-red-400 mb-2">데이터 로드 실패</h2>
          <p className="text-xs text-neutral-400 whitespace-pre-wrap break-all mb-4">
            {serverError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-zinc-950 transition hover:bg-neutral-250"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  // Witty completion screen when all questions have been voted on (Top Ad removed)
  if (noMoreQuestions) {
    return (
      <div className="relative flex h-[100dvh] w-full max-w-md mx-auto flex-col justify-between overflow-hidden bg-zinc-950 text-white font-sans">
        {/* Content area */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 text-center py-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="flex flex-col items-center max-w-sm animate-fade-in"
          >
            <div className="h-16 w-16 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-black mb-4">대단해요! 정복 완료 🎉</h2>
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line mb-8">
              BALS의 모든 질문에 답변하셨습니다!{"\n"}
              여러분의 참여로 통계가 더욱 완벽해졌어요.{"\n\n"}
              더욱 기상천외하고 머리 아픈 질문들을 열심히 수집하고 있으니 잠시만 기다려주세요! 🙋‍♂️
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleResetHistory}
              className="flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-neutral-200 text-zinc-950 font-black px-6 h-12 text-sm shadow-lg w-full"
            >
              <RefreshCw className="h-4 w-4" /> 처음부터 다시 하기
            </motion.button>
          </motion.div>
        </div>

        {/* Terms and Privacy policy */}
        <div className="text-[10px] text-center text-zinc-650 flex justify-center gap-3 py-2.5 border-t border-zinc-900/40 shrink-0">
          <Link href="/privacy" className="hover:text-zinc-400 hover:underline">개인정보처리방침</Link>
          <span>|</span>
          <Link href="/terms" className="hover:text-zinc-400 hover:underline">이용약관</Link>
        </div>

        {/* Bottom Ad */}
        <div className="adsense-slot adsense-bottom flex justify-center bg-zinc-900/20 border-t border-zinc-900/50 shrink-0" style={{ minHeight: '100px', width: '100%' }}>
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3522634980237009" crossOrigin="anonymous"></script>
          <ins className="adsbygoogle"
               style={{ display: 'block' }}
               data-ad-client="ca-pub-3522634980237009"
               data-ad-slot="7310226958"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        </div>
      </div>
    );
  }

  // Full Screen Prominent Logo in the main initial loading screen
  if (!question) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-zinc-950 text-white font-sans p-6 text-center">
        <div className="flex flex-col items-center gap-8">
          <div className="relative h-44 w-96 overflow-hidden mb-2">
            <Image
              src="/logo.jpg"
              alt="BALS Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent border-neutral-700" />
            <p className="text-base font-semibold text-neutral-400">질문을 불러오고 있습니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[100dvh] w-full max-w-md mx-auto flex-col justify-between overflow-hidden bg-zinc-950 text-white font-sans select-none">
      
      {/* 2. Top Navigation Bar (AdSense top removed, Logo removed, Only category, maximized spacing) */}
      <header className="flex items-center justify-center py-4 shrink-0 bg-zinc-950/20">
        {question.category && (
          <span className="inline-block rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-400 tracking-widest uppercase border border-zinc-850">
            {question.category}
          </span>
        )}
      </header>

      {/* 3. Main Dynamic Content Area (Expanded to occupy maximal vertical height) */}
      <main className="flex-1 flex flex-col min-h-0 px-4 py-4 justify-between">
        
        {/* Question Title Header - Large & Bold */}
        <div className="text-center py-3 shrink-0">
          <h1 className="text-2xl md:text-3xl font-extrabold leading-snug text-neutral-100 tracking-tight whitespace-pre-line px-2">
            {question.title}
          </h1>
        </div>

        {/* Voting Stack Container (Takes maximum screen space) */}
        <div className="flex-grow flex flex-col gap-4 min-h-0 my-3 relative">
          
          {/* Card Option A (Top) */}
          <motion.button
            layout
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
            style={{ flexGrow: hasVoted ? displayGrowA : 50 }}
            whileTap={{ scale: hasVoted ? 1 : 0.98 }}
            onClick={() => handleVote('A')}
            disabled={hasVoted}
            className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl py-4 px-5 transition-all duration-300 text-left border ${
              hasVoted
                ? selectedOption === 'A'
                  ? 'bg-zinc-900/90 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'bg-zinc-950/40 border-zinc-900/80 opacity-60'
                : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
            }`}
          >
            {/* Absolute Percentage Fill Animation */}
            {hasVoted && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`absolute inset-0 z-0 opacity-10 ${
                  selectedOption === 'A' ? 'bg-amber-500' : 'bg-neutral-400'
                }`}
                style={{ width: `${percentA}%`, transformOrigin: 'left' }}
              />
            )}

            <div className="relative z-10 flex flex-col items-center text-center w-full max-w-xs pointer-events-none">
              <div className="flex items-center gap-2 mb-1.5 justify-center">
                {question.emoji_a && (
                  <span className="text-2xl leading-none">{question.emoji_a}</span>
                )}
              </div>
              
              <p className="text-lg md:text-xl font-black leading-tight text-neutral-100 mb-1 max-h-24 overflow-y-auto">
                {question.option_a}
              </p>

              {/* Dynamic Vote Results (1 Decimal Place) */}
              <AnimatePresence>
                {hasVoted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="mt-1"
                  >
                    <span className="text-4xl md:text-5xl font-black text-amber-400">{percentA.toFixed(1)}%</span>
                    <span className="text-xs text-neutral-500 block font-semibold mt-0.5">
                      {votesA.toLocaleString()}명 선택
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>

          {/* Card Option B (Bottom) */}
          <motion.button
            layout
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
            style={{ flexGrow: hasVoted ? displayGrowB : 50 }}
            whileTap={{ scale: hasVoted ? 1 : 0.98 }}
            onClick={() => handleVote('B')}
            disabled={hasVoted}
            className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl py-4 px-5 transition-all duration-300 text-left border ${
              hasVoted
                ? selectedOption === 'B'
                  ? 'bg-zinc-900/90 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-zinc-950/40 border-zinc-900/80 opacity-60'
                : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
            }`}
          >
            {/* Absolute Percentage Fill Animation */}
            {hasVoted && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`absolute inset-0 z-0 opacity-10 ${
                  selectedOption === 'B' ? 'bg-emerald-500' : 'bg-neutral-400'
                }`}
                style={{ width: `${percentB}%`, transformOrigin: 'left' }}
              />
            )}

            <div className="relative z-10 flex flex-col items-center text-center w-full max-w-xs pointer-events-none">
              <div className="flex items-center gap-2 mb-1.5 justify-center">
                {question.emoji_b && (
                  <span className="text-2xl leading-none">{question.emoji_b}</span>
                )}
              </div>

              <p className="text-lg md:text-xl font-black leading-tight text-neutral-100 mb-1 max-h-24 overflow-y-auto">
                {question.option_b}
              </p>

              {/* Dynamic Vote Results (1 Decimal Place) */}
              <AnimatePresence>
                {hasVoted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="mt-1"
                  >
                    <span className="text-4xl md:text-5xl font-black text-emerald-400">{percentB.toFixed(1)}%</span>
                    <span className="text-xs text-neutral-500 block font-semibold mt-0.5">
                      {votesB.toLocaleString()}명 선택
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>

        </div>

        {/* Action Controls & Navigation (Post-Vote) */}
        <div className="h-16 shrink-0 flex items-center justify-between gap-3 mt-2">
          {hasVoted ? (
            <>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setShowStats(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 px-5 h-12 text-base font-bold text-neutral-200 transition-all flex-1 shadow-md"
              >
                <BarChart3 className="h-4.5 w-4.5 text-neutral-400" /> 통계 보기
              </motion.button>
              
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleNextQuestion}
                disabled={redirecting}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-neutral-200 text-zinc-950 font-extrabold px-6 h-12 text-base transition-all flex-[1.4] shadow-lg disabled:opacity-50"
              >
                {redirecting ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                ) : (
                  <>다음 질문 <ChevronRight className="h-5 w-5" /></>
                )}
              </motion.button>
            </>
          ) : (
            <div className="w-full flex justify-center text-xs text-zinc-500 gap-1.5 items-center font-medium">
              <HelpCircle className="h-3.5 w-3.5 text-zinc-600" />
              <span>선택지를 누르면 결과와 통계가 공개됩니다.</span>
            </div>
          )}
          
          <button
            onClick={() => setShowShareSheet(true)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 h-12 w-12 flex items-center justify-center hover:bg-zinc-900 hover:text-white transition text-zinc-400 shadow-md shrink-0"
            title="공유하기"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

      </main>

      {/* Tiny Legal Footer (Pushed to the very bottom above bottom AdSlot) */}
      <div className="text-[10px] text-center text-zinc-650 flex justify-center gap-3 py-2.5 border-t border-zinc-900/40 shrink-0">
        <Link href="/privacy" className="hover:text-zinc-400 hover:underline">개인정보처리방침</Link>
        <span>|</span>
        <Link href="/terms" className="hover:text-zinc-400 hover:underline">이용약관</Link>
      </div>

      {/* 4. AdSense Bottom Slot */}
      <div className="adsense-slot adsense-bottom flex justify-center bg-zinc-900/20 border-t border-zinc-900/50 shrink-0" style={{ minHeight: '100px', width: '100%' }}>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3522634980237009" crossOrigin="anonymous"></script>
        <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client="ca-pub-3522634980237009"
             data-ad-slot="7310226958"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>

      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal onComplete={handleOnboardingComplete} />
        )}
        {showStats && question && (
          <StatsBottomSheet
            questionId={question.id}
            onClose={() => setShowStats(false)}
          />
        )}
        {showShareSheet && question && (
          <ShareSheet
            onClose={() => setShowShareSheet(false)}
            shareUrl={`${window.location.origin}/?q=${question.id}`}
            questionTitle={question.title}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

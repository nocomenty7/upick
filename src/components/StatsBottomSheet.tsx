'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, PieChart, BarChart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StatsBottomSheetProps {
  questionId: string;
  onClose: () => void;
}

interface VoteStats {
  gender: {
    maleA: number;
    maleB: number;
    maleAPercent: number;
    maleBPercent: number;
    femaleA: number;
    femaleB: number;
    femaleAPercent: number;
    femaleBPercent: number;
  };
  ageGroups: {
    name: string;
    countA: number;
    countB: number;
    percentA: number;
    percentB: number;
    total: number;
  }[];
  totalVotes: number;
}

export default function StatsBottomSheet({ questionId, onClose }: StatsBottomSheetProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VoteStats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('gender, age_group, selected_option')
          .eq('question_id', questionId);

        if (error) throw error;

        if (!data || data.length === 0) {
          setStats({
            gender: {
              maleA: 0, maleB: 0, maleAPercent: 50.0, maleBPercent: 50.0,
              femaleA: 0, femaleB: 0, femaleAPercent: 50.0, femaleBPercent: 50.0
            },
            ageGroups: [],
            totalVotes: 0
          });
          setLoading(false);
          return;
        }

        const totalVotes = data.length;
        let maleA = 0;
        let maleB = 0;
        let femaleA = 0;
        let femaleB = 0;
        const ageMap: Record<string, { A: number; B: number }> = {
          '10대': { A: 0, B: 0 },
          '20대': { A: 0, B: 0 },
          '30대': { A: 0, B: 0 },
          '40대': { A: 0, B: 0 },
          '50대': { A: 0, B: 0 },
          '60대': { A: 0, B: 0 },
          '70대 이상': { A: 0, B: 0 }
        };

        data.forEach((row) => {
          const isA = row.selected_option === 'A';
          if (row.gender === '남성') {
            if (isA) maleA++; else maleB++;
          } else if (row.gender === '여성') {
            if (isA) femaleA++; else femaleB++;
          }

          if (ageMap[row.age_group] !== undefined) {
            if (isA) ageMap[row.age_group].A++;
            else ageMap[row.age_group].B++;
          }
        });

        // Compute percentages inside Male / Female demographics
        const maleTotal = maleA + maleB;
        const maleAPercent = maleTotal > 0 ? Number(((maleA / maleTotal) * 100).toFixed(1)) : 50.0;
        const maleBPercent = maleTotal > 0 ? Number((100 - maleAPercent).toFixed(1)) : 50.0;

        const femaleTotal = femaleA + femaleB;
        const femaleAPercent = femaleTotal > 0 ? Number(((femaleA / femaleTotal) * 100).toFixed(1)) : 50.0;
        const femaleBPercent = femaleTotal > 0 ? Number((100 - femaleAPercent).toFixed(1)) : 50.0;

        // Compute percentages per age group
        const ageGroups = Object.keys(ageMap).map((key) => {
          const a = ageMap[key].A;
          const b = ageMap[key].B;
          const totalAge = a + b;
          const percentA = totalAge > 0 ? Number(((a / totalAge) * 100).toFixed(1)) : 50.0;
          const percentB = totalAge > 0 ? Number((100 - percentA).toFixed(1)) : 50.0;

          return {
            name: key,
            countA: a,
            countB: b,
            percentA,
            percentB,
            total: totalAge
          };
        });

        setStats({
          gender: {
            maleA, maleB, maleAPercent, maleBPercent,
            femaleA, femaleB, femaleAPercent, femaleBPercent
          },
          ageGroups,
          totalVotes
        });
      } catch (err) {
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [questionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      {/* Backdrop Click to Close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative z-10 w-full max-w-md rounded-t-3xl bg-neutral-900/98 border-t border-neutral-800 p-6 text-white shadow-2xl backdrop-blur-xl flex flex-col max-h-[80dvh] overflow-hidden"
      >
        {/* Fixed Header Indicator */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-700 cursor-pointer shrink-0" onClick={onClose} />

        {/* Fixed Title Header */}
        <div className="mb-5 flex items-center justify-between shrink-0">
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-neutral-400" />
            상세 통계 내용
          </h3>
          <button
            onClick={onClose}
            className="rounded-full bg-neutral-800 p-2 text-neutral-400 hover:bg-neutral-700 hover:text-white transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 flex-1">
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-t-transparent border-neutral-600" />
            <p className="text-sm text-neutral-500 font-semibold">통계 데이터를 불러오는 중...</p>
          </div>
        ) : stats ? (
          <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4 min-h-0">
            {/* Stats Overview */}
            <div className="text-center bg-neutral-850 border border-neutral-800 rounded-2xl py-4 px-6">
              <span className="text-xs text-neutral-400 block mb-0.5 font-bold uppercase tracking-wider">전체 참여자 수</span>
              <span className="text-3xl font-black text-white">{stats.totalVotes.toLocaleString()}</span>
              <span className="text-sm text-neutral-400 font-semibold"> 명 투표 완료</span>
            </div>

            {/* Gender Breakdown (Option A vs Option B ratio per gender) */}
            <div className="space-y-4">
              <h4 className="text-base font-extrabold text-neutral-200 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-neutral-400" /> 성별 선택 비율
              </h4>
              
              <div className="space-y-4 bg-neutral-850/30 border border-neutral-850 p-4 rounded-2xl">
                {/* 1. Male Breakdown */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold px-1">
                    <span className="text-neutral-300 font-extrabold text-sm">🙋‍♂️ 남성 통계</span>
                    {stats.gender.maleA + stats.gender.maleB > 0 ? (
                      <div className="space-x-1.5">
                        <span className="text-amber-400">A선택 {stats.gender.maleAPercent}%</span>
                        <span className="text-neutral-600">|</span>
                        <span className="text-emerald-400">B선택 {stats.gender.maleBPercent}%</span>
                      </div>
                    ) : (
                      <span className="text-neutral-500 text-xs font-medium">참여한 남성 없음</span>
                    )}
                  </div>

                  <div className="relative flex h-3.5 w-full overflow-hidden rounded-full bg-zinc-800 shadow-inner">
                    {stats.gender.maleA + stats.gender.maleB > 0 ? (
                      <>
                        <div style={{ width: `${stats.gender.maleAPercent}%` }} className="h-full bg-amber-500/80" />
                        <div style={{ width: `${stats.gender.maleBPercent}%` }} className="h-full bg-emerald-500/80" />
                      </>
                    ) : (
                      <div className="h-full w-full bg-zinc-850" />
                    )}
                  </div>
                </div>

                {/* 2. Female Breakdown */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold px-1">
                    <span className="text-neutral-300 font-extrabold text-sm">🙋‍♀️ 여성 통계</span>
                    {stats.gender.femaleA + stats.gender.femaleB > 0 ? (
                      <div className="space-x-1.5">
                        <span className="text-amber-400">A선택 {stats.gender.femaleAPercent}%</span>
                        <span className="text-neutral-600">|</span>
                        <span className="text-emerald-400">B선택 {stats.gender.femaleBPercent}%</span>
                      </div>
                    ) : (
                      <span className="text-neutral-500 text-xs font-medium">참여한 여성 없음</span>
                    )}
                  </div>

                  <div className="relative flex h-3.5 w-full overflow-hidden rounded-full bg-zinc-800 shadow-inner">
                    {stats.gender.femaleA + stats.gender.femaleB > 0 ? (
                      <>
                        <div style={{ width: `${stats.gender.femaleAPercent}%` }} className="h-full bg-amber-500/80" />
                        <div style={{ width: `${stats.gender.femaleBPercent}%` }} className="h-full bg-emerald-500/80" />
                      </>
                    ) : (
                      <div className="h-full w-full bg-zinc-850" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Age Group Breakdown (Option A vs Option B ratio per age group) */}
            <div className="space-y-4">
              <h4 className="text-base font-extrabold text-neutral-200 flex items-center gap-2">
                <BarChart className="h-5 w-5 text-neutral-400" /> 연령별 선택 비율
              </h4>
              <div className="space-y-3 bg-neutral-850/40 border border-neutral-850 p-4 rounded-2xl">
                {stats.ageGroups.map((group) => (
                  <div key={group.name} className="flex flex-col gap-1.5 text-sm">
                    <div className="flex justify-between items-center px-0.5">
                      <span className="text-neutral-300 font-extrabold text-xs">{group.name}</span>
                      {group.total > 0 ? (
                        <div className="text-[11px] font-bold space-x-1.5">
                          <span className="text-amber-400">A {group.percentA}%</span>
                          <span className="text-zinc-700">/</span>
                          <span className="text-emerald-400">B {group.percentB}%</span>
                        </div>
                      ) : (
                        <span className="text-neutral-600 text-[10px] font-medium">투표 없음</span>
                      )}
                    </div>

                    <div className="relative flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-800 shadow-inner">
                      {group.total > 0 ? (
                        <>
                          <div style={{ width: `${group.percentA}%` }} className="h-full bg-amber-500/75" />
                          <div style={{ width: `${group.percentB}%` }} className="h-full bg-emerald-500/75" />
                        </>
                      ) : (
                        <div className="h-full w-full bg-zinc-850" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-10 text-neutral-500 font-bold flex-1">통계 데이터를 불러올 수 없습니다.</div>
        )}
      </motion.div>
    </div>
  );
}

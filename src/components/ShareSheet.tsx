'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, MessageSquare, ExternalLink, Image as ImageIcon, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ShareSheetProps {
  onClose: () => void;
  shareUrl: string;
  questionTitle: string;
}

export default function ShareSheet({ onClose, shareUrl, questionTitle }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [showInstaGuide, setShowInstaGuide] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCaptureImage = () => {
    if (capturing) return;
    setCapturing(true);

    // Give a slight delay to allow modal state changes to render, if any
    setTimeout(() => {
      const element = document.getElementById('game-capture-area');
      if (element) {
        // Enforce temp visible properties for clean rendering
        html2canvas(element, {
          useCORS: true,
          backgroundColor: '#09090b', // Zinc-950 theme background
          scale: 3, // 3x high resolution for retina displays and crisp text
          logging: false,
          allowTaint: true,
        })
          .then((canvas) => {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `UPICK-game-result.png`;
            link.click();
          })
          .catch((err) => {
            console.error('Image export failed:', err);
            alert('이미지 생성에 실패했습니다. 디바이스의 제한 사항을 확인해 주세요.');
          })
          .finally(() => {
            setCapturing(false);
          });
      } else {
        alert('캡처 영역을 찾을 수 없습니다.');
        setCapturing(false);
      }
    }, 100);
  };

  const handleKakaoShare = () => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      const Kakao = window.Kakao;
      const executeShare = () => {
        // @ts-ignore
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: 'UPICK - 모두의 밸런스게임',
            description: questionTitle,
            imageUrl: `${window.location.origin}/logo.jpg`,
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
          buttons: [
            {
              title: '게임하러 가기',
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
              },
            },
          ],
        });
      };

      if (Kakao) {
        if (!Kakao.isInitialized()) {
          Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY');
        }
        executeShare();
      } else {
        const script = document.createElement('script');
        script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
        script.integrity = 'sha384-0rrOCpPt419n70x7cdJLT0Imw7476596ib5IaIIHN8XsV21t14d3fR3a79f64798';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          // @ts-ignore
          if (window.Kakao && !window.Kakao.isInitialized()) {
            // @ts-ignore
            window.Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY');
          }
          executeShare();
        };
        document.head.appendChild(script);
      }
    }
  };

  const handleInstagramShare = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    setShowInstaGuide(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative z-10 w-full max-w-md rounded-t-3xl bg-neutral-900/98 border-t border-neutral-800 p-6 text-white shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden max-h-[70dvh]"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-700 cursor-pointer shrink-0" onClick={onClose} />

        <div className="mb-5 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-black tracking-tight">공유하기</h3>
          <button
            onClick={onClose}
            className="rounded-full bg-neutral-800 p-2 text-neutral-400 hover:bg-neutral-700 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Buttons List */}
        <div className="space-y-3 pb-6 flex-1 overflow-y-auto min-h-0 pr-1">
          {/* Capture Image Button */}
          <button
            onClick={handleCaptureImage}
            disabled={capturing}
            className="flex w-full items-center gap-3 rounded-2xl bg-zinc-800 border border-zinc-750 hover:bg-zinc-750 text-neutral-200 font-extrabold p-4 transition-all shadow-md text-sm disabled:opacity-50"
          >
            {capturing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                <span>이미지 파일 생성 중...</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-5 w-5 text-neutral-300" />
                <span>결과 화면 이미지로 저장하기</span>
              </>
            )}
          </button>

          {/* Kakao Talk button */}
          <button
            onClick={handleKakaoShare}
            className="flex w-full items-center gap-3 rounded-2xl bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] font-extrabold p-4 transition-all shadow-md text-sm"
          >
            <MessageSquare className="h-5 w-5 fill-[#191919] stroke-none" />
            <span>카카오톡으로 공유하기</span>
          </button>

          {/* Instagram button */}
          <button
            onClick={handleInstagramShare}
            className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] hover:opacity-90 text-white font-extrabold p-4 transition-all shadow-md text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
            <span>인스타그램 스토리에 공유</span>
          </button>

          {/* Copy URL button */}
          <button
            onClick={handleCopyLink}
            className="flex w-full items-center justify-between rounded-2xl bg-neutral-800 border border-neutral-750 hover:bg-neutral-750 text-neutral-200 font-extrabold p-4 transition-all shadow-md text-sm"
          >
            <div className="flex items-center gap-3">
              {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
              <span>{copied ? '복사되었습니다!' : '링크 주소 복사하기'}</span>
            </div>
            <ExternalLink className="h-4 w-4 text-neutral-500" />
          </button>

          {/* Instagram Story Sharing Guidance Dialog */}
          <AnimatePresence>
            {showInstaGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl bg-neutral-850 border border-neutral-800 p-4 mt-3 text-xs leading-relaxed text-neutral-400 space-y-2"
              >
                <div className="flex items-center gap-1.5 text-neutral-200 font-bold mb-1">
                  <span className="text-sm">💡</span>
                  <span>인스타그램 스토리 공유 팁</span>
                </div>
                <p>
                  1. 게임 링크가 클립보드에 **자동으로 복사**되었습니다.
                </p>
                <p>
                  2. 위의 **[결과 화면 이미지로 저장하기]** 버튼을 눌러 결과 캡처 이미지를 갤러리에 저장해 보세요.
                </p>
                <p>
                  3. 인스타그램 스토리에 결과 이미지를 올리고 **'링크' 스티커** 기능을 사용해 복사된 링크를 붙여넣어 함께 공유하면 효과적입니다!
                </p>
                <button
                  onClick={() => setShowInstaGuide(false)}
                  className="text-white font-bold hover:underline underline-offset-4 mt-2 block"
                >
                  닫기
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

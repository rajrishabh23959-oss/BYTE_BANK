'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  MessageSquare,
  X,
  Send,
  Maximize2,
  Minimize2,
  ExternalLink,
} from 'lucide-react';
import RobotAvatarSvg from './RobotAvatarSvg';

const CuteRobotCanvas = dynamic(() => import('./CuteRobotCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center p-2">
      <RobotAvatarSvg className="w-12 h-12 animate-pulse" />
    </div>
  ),
});

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
}

const KNOWLEDGE: Record<string, { reply: string; link?: string; label?: string }> = {
  credentials: {
    reply: "Test Role Logins (password: password123):\n• Customer: rishi.sharma101@email.com (BB-ACC-5001)\n• Counterparty: rahul.verma102@email.com (BB-ACC-5002)\n• Admin: admin@bytebank.test\n• Auditor: auditor@bytebank.test",
    link: "/login",
    label: "Go to Login",
  },
  concurrency: {
    reply: "DBMS Concurrency Isolation Lab:\nSimulates two concurrent database connections attempting to transfer 0.8 BTC from a 1.0 BTC balance. PostgreSQL row-level locking (SELECT ... FOR UPDATE) serializes requests. Connection 1 commits, Connection 2 aborts with Insufficient Balance, preserving exactly 0.20000000 BTC.",
    link: "/admin/lab",
    label: "Open Concurrency Lab",
  },
  transfer: {
    reply: "Transfer Architecture:\nTransfers execute within atomic transactions. Invariant: holding = SUM(ledger_entry). An append-only trigger prohibits UPDATE and DELETE statements on ledger records.",
    link: "/customer/transfer",
    label: "Try Transfer Demo",
  },
  download: {
    reply: "Open Artifacts:\nYou can download the complete PostgreSQL 16 schema SQL, the 125-customer synthetic dataset CSV, and the OpenAPI 3.1 contract.",
    link: "/download",
    label: "Download Center",
  },
};

export default function RoamingMascot() {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  const [isMoving, setIsMoving] = useState(false);
  const [headingZ, setHeadingZ] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hi! You're through to ByteBank support. Ask anything and we'll reply right here.",
      timestamp: 'Just now',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const stageIndexRef = useRef(0);
  const stageStartRef = useRef(0);
  const dragHoldUntilRef = useRef(0);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isReducedMotionRef = useRef(false);

  const checkHealth = useCallback(() => {
    fetch('/api/public/metrics')
      .then((res) => {
        setIsOnline(res.ok);
      })
      .catch(() => {
        setIsOnline(false);
      });
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      isReducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }, []);

  const getWaypoints = useCallback(() => {
    if (typeof window === 'undefined') return [];
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const isMobile = winW < 768;
    const bw = isMobile ? 64 : 84;
    const bh = isMobile ? 76 : 96;
    const pad = 20;
    const topPad = 92;

    const br = { x: winW - bw - pad, y: winH - bh - pad };
    const bl = { x: pad, y: winH - bh - pad };
    const midL = { x: pad, y: Math.max(winH - bh - pad - 140, winH * 0.6) };
    const midR = { x: winW - bw - pad, y: Math.max(winH - bh - pad - 140, winH * 0.6) };

    if (isMobile) {
      return [
        { from: br, to: br, duration: 30000, isMoving: false },
        { from: br, to: bl, duration: 20000, isMoving: true },
        { from: bl, to: bl, duration: 15000, isMoving: false },
        { from: bl, to: br, duration: 20000, isMoving: true },
      ];
    }

    return [
      { from: br, to: br, duration: 30000, isMoving: false },
      { from: br, to: bl, duration: 20000, isMoving: true },
      { from: bl, to: bl, duration: 10000, isMoving: false },
      { from: bl, to: midL, duration: 15000, isMoving: true },
      { from: midL, to: midL, duration: 8000, isMoving: false },
      { from: midL, to: bl, duration: 15000, isMoving: true },
      { from: bl, to: br, duration: 20000, isMoving: true },
      { from: br, to: midR, duration: 15000, isMoving: true },
      { from: midR, to: midR, duration: 8000, isMoving: false },
      { from: midR, to: br, duration: 15000, isMoving: true },
    ];
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stages = getWaypoints();
    if (stages.length > 0 && pos.x === -999) {
      setPos({ x: stages[0].from.x, y: stages[0].from.y });
      stageStartRef.current = performance.now();
    }

    const handleResize = () => {
      const refreshed = getWaypoints();
      if (refreshed.length > 0) {
        const curStage = refreshed[stageIndexRef.current % refreshed.length];
        setPos({ x: curStage.to.x, y: curStage.to.y });
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [getWaypoints, pos.x]);

  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      if (isReducedMotionRef.current) {
        const stages = getWaypoints();
        if (stages.length > 0) {
          setPos({ x: stages[0].from.x, y: stages[0].from.y });
          setIsMoving(false);
          setHeadingZ(0);
        }
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      if (isDragging) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const now = Date.now();
      if (now < dragHoldUntilRef.current) {
        setIsMoving(false);
        setHeadingZ(0);
        stageStartRef.current = time;
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      if (isHovered || isChatOpen) {
        stageStartRef.current += dt;
        setIsMoving(false);
        setHeadingZ(0);
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const stages = getWaypoints();
      if (stages.length === 0) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const stage = stages[stageIndexRef.current % stages.length];
      const elapsed = time - stageStartRef.current;
      const progress = Math.min(1, Math.max(0, elapsed / stage.duration));

      const easeProgress =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;

      const currentX = stage.from.x + (stage.to.x - stage.from.x) * easeProgress;
      const currentY = stage.from.y + (stage.to.y - stage.from.y) * easeProgress;

      setPos({ x: currentX, y: currentY });
      setIsMoving(stage.isMoving);

      if (stage.isMoving) {
        const dx = stage.to.x - stage.from.x;
        if (dx < -2) setHeadingZ(-0.16);
        else if (dx > 2) setHeadingZ(0.16);
        else setHeadingZ(0);
      } else {
        setHeadingZ(0);
      }

      if (progress >= 1) {
        stageIndexRef.current = (stageIndexRef.current + 1) % stages.length;
        stageStartRef.current = time;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [getWaypoints, isChatOpen, isDragging, isHovered]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const nextX = Math.max(12, Math.min(window.innerWidth - 90, e.clientX - dragOffsetRef.current.x));
    const nextY = Math.max(12, Math.min(window.innerHeight - 100, e.clientY - dragOffsetRef.current.y));
    setPos({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      dragHoldUntilRef.current = Date.now() + 60000;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch { }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) scrollToBottom();
  }, [messages, isChatOpen]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let replyData: { reply: string; link?: string; label?: string } = {
        reply: "I am ByteBank's DBMS Assistant! Ask about 'credentials', 'concurrency race lab', 'transfer demo', or 'schema download'.",
        link: undefined,
        label: undefined,
      };

      if (lower.includes('credential') || lower.includes('login') || lower.includes('account') || lower.includes('password')) {
        replyData = KNOWLEDGE.credentials;
      } else if (lower.includes('concurrency') || lower.includes('race') || lower.includes('lock') || lower.includes('lab')) {
        replyData = KNOWLEDGE.concurrency;
      } else if (lower.includes('transfer') || lower.includes('ledger') || lower.includes('invariant') || lower.includes('double')) {
        replyData = KNOWLEDGE.transfer;
      } else if (lower.includes('download') || lower.includes('schema') || lower.includes('dataset') || lower.includes('sql')) {
        replyData = KNOWLEDGE.download;
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: replyData.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionUrl: replyData.link,
        actionLabel: replyData.label,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  if (pos.x === -999) return null;

  const isNearBottom = pos.y > (typeof window !== 'undefined' ? window.innerHeight / 2 : 400);
  const isNearRight = pos.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 400);

  return (
    <div
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 40,
        pointerEvents: 'none',
      }}
      className="transition-[left,top] duration-75 select-none"
    >
      <div
        className="relative pointer-events-auto flex flex-col items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {isChatOpen && (
          <div
            style={{
              position: 'absolute',
              [isNearBottom ? 'bottom' : 'top']: '105%',
              [isNearRight ? 'right' : 'left']: '0',
            }}
            className={`rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white flex flex-col overflow-hidden transition-all duration-300 z-50 animate-in fade-in ${isChatExpanded ? 'h-[540px] w-[420px]' : 'h-[440px] w-80 sm:w-92'
              }`}
          >
            <div className="px-4 py-3 bg-[#0B4FFF] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 p-1 flex items-center justify-center shrink-0 border border-white/30 overflow-hidden">
                  <RobotAvatarSvg className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight flex items-center gap-1.5 text-white">
                    ByteBank Support
                  </div>
                  {isOnline ? (
                    <div className="text-[10px] text-[#1FD6A0] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1FD6A0] inline-block animate-pulse" />
                      Online
                    </div>
                  ) : (
                    <div className="text-[10px] text-white/70 font-medium">
                      Assistant
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 text-white/80">
                <button
                  onClick={() => setIsChatExpanded(!isChatExpanded)}
                  className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  title={isChatExpanded ? 'Minimize' : 'Expand'}
                >
                  {isChatExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-[#FAFCFF]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[88%] ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {m.sender === 'bot' && (
                      <div className="w-6 h-6 rounded-full bg-[#EBF2FF] border border-[#B9C6FF] flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                        <RobotAvatarSvg className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${m.sender === 'user'
                        ? 'bg-[#0B4FFF] text-white font-medium rounded-br-none shadow-sm'
                        : 'bg-white text-[#2B2F4A] border border-[#E8ECF6] rounded-tl-none shadow-sm'
                        }`}
                    >
                      <div>{m.text}</div>
                      {m.actionUrl && m.actionLabel && (
                        <div className="pt-2">
                          <Link
                            href={m.actionUrl}
                            onClick={() => setIsChatOpen(false)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0B4FFF] text-white text-[11px] font-semibold hover:bg-[#0A3FD1] transition-colors"
                          >
                            <span>{m.actionLabel}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] text-[#6B7090] mt-1 px-1">{m.timestamp}</span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1 p-2.5 rounded-2xl bg-white border border-[#E8ECF6] text-[#6B7090] text-xs w-16 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B4FFF] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B4FFF] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B4FFF] animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-3 py-2 bg-[#F3F7FF] border-t border-[#E8ECF6] flex gap-1.5 overflow-x-auto text-[10px] font-mono scrollbar-none">
              <button
                onClick={() => handleSend('Test credentials')}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-[#EBF2FF] border border-[#E8ECF6] text-[#0B4FFF] shrink-0 transition-colors shadow-2xs"
              >
                Credentials
              </button>
              <button
                onClick={() => handleSend('Concurrency race lab')}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-[#EBF2FF] border border-[#E8ECF6] text-[#0B4FFF] shrink-0 transition-colors shadow-2xs"
              >
                Concurrency Lab
              </button>
              <button
                onClick={() => handleSend('Transfer demo')}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-[#EBF2FF] border border-[#E8ECF6] text-[#0B4FFF] shrink-0 transition-colors shadow-2xs"
              >
                Transfer Demo
              </button>
              <button
                onClick={() => handleSend('Download schema')}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-[#EBF2FF] border border-[#E8ECF6] text-[#0B4FFF] shrink-0 transition-colors shadow-2xs"
              >
                Schema
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-2.5 bg-white border-t border-[#E8ECF6] flex items-center gap-2"
            >
              <div className="flex-1 flex items-center gap-2 bg-[#F3F7FF] border border-[#E8ECF6] rounded-full px-3 py-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#6B7090] shrink-0" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask ByteBank..."
                  className="w-full bg-transparent border-0 text-[#2B2F4A] placeholder-[#6B7090] text-xs focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-8 h-8 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md shrink-0"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        )}

        <div
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="group relative cursor-pointer flex flex-col items-center"
        >
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-b from-[#F5F8FF] to-white p-1 border-2 border-[#0B4FFF]/25 group-hover:border-[#0B4FFF] shadow-[0_8px_25px_rgba(11,79,255,0.22)] group-hover:shadow-[0_12px_32px_rgba(11,79,255,0.34)] transition-all duration-300 transform group-hover:scale-105 active:scale-95 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#EBF2FF] to-white flex items-center justify-center p-1.5 overflow-hidden">
              <RobotAvatarSvg className="w-full h-full drop-shadow-xs select-none" />
            </div>

            {isOnline && (
              <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1FD6A0] opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#1FD6A0] border-2 border-white shadow-xs" />
              </span>
            )}
          </div>

          {!isChatOpen && (
            <div className="mt-1 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#E8ECF6] shadow-card-white text-[10px] font-bold text-[#1B0B5C] flex items-center gap-1 group-hover:text-[#0B4FFF] group-hover:border-[#0B4FFF]/30 transition-colors whitespace-nowrap">
              <MessageSquare className="w-2.5 h-2.5 text-[#0B4FFF]" />
              <span>ByteBank AI</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


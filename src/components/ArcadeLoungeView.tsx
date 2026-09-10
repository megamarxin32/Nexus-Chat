import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Trophy,
  Brain,
  Zap,
  RotateCcw,
  Sparkles,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Award,
  CircleDot,
  Send,
  Users,
  Swords,
} from 'lucide-react';
import { TRIVIA_QUESTIONS, WORDLE_WORDS, TriviaQuestion } from '../data/arcadeData';
import { Chat, UserProfile, ThemeSettings } from '../types';

interface ArcadeLoungeViewProps {
  currentUser: UserProfile | null;
  chats: Chat[];
  themeSettings: ThemeSettings;
  onSendMessageToChat: (chatId: string, text: string) => void;
  onNavigateToChat?: (chatId: string) => void;
}

type ArcadeGame = 'trivia' | 'wordle' | 'connect4' | 'reflexes';

export const ArcadeLoungeView: React.FC<ArcadeLoungeViewProps> = ({
  currentUser,
  chats,
  themeSettings,
  onSendMessageToChat,
  onNavigateToChat,
}) => {
  const [activeGame, setActiveGame] = useState<ArcadeGame>('trivia');

  // Challenge modal state
  const [challengeShareText, setChallengeShareText] = useState<string | null>(null);

  // ==========================================
  // 1. TRIVIA GAME STATE
  // ==========================================
  const [triviaIndex, setTriviaIndex] = useState<number>(0);
  const [triviaScore, setTriviaScore] = useState<number>(0);
  const [triviaStreak, setTriviaStreak] = useState<number>(0);
  const [triviaSelectedAnswer, setTriviaSelectedAnswer] = useState<number | null>(null);
  const [triviaAnswerSubmitted, setTriviaAnswerSubmitted] = useState<boolean>(false);
  const [triviaTimeLeft, setTriviaTimeLeft] = useState<number>(15);
  const [triviaGameOver, setTriviaGameOver] = useState<boolean>(false);

  const currentQuestion = TRIVIA_QUESTIONS[triviaIndex % TRIVIA_QUESTIONS.length];

  // Trivia countdown timer
  useEffect(() => {
    if (activeGame !== 'trivia' || triviaAnswerSubmitted || triviaGameOver) return;

    if (triviaTimeLeft <= 0) {
      // Time expired
      handleTriviaAnswer(-1);
      return;
    }

    const timer = setInterval(() => {
      setTriviaTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeGame, triviaTimeLeft, triviaAnswerSubmitted, triviaGameOver]);

  const handleTriviaAnswer = (answerIdx: number) => {
    if (triviaAnswerSubmitted) return;
    setTriviaSelectedAnswer(answerIdx);
    setTriviaAnswerSubmitted(true);

    const isCorrect = answerIdx === currentQuestion.correctIndex;
    if (isCorrect) {
      const bonusStreak = triviaStreak * 50;
      const points = 100 + bonusStreak + Math.max(0, triviaTimeLeft * 10);
      setTriviaScore((prev) => prev + points);
      setTriviaStreak((prev) => prev + 1);
    } else {
      setTriviaStreak(0);
    }
  };

  const handleNextTrivia = () => {
    if (triviaIndex >= TRIVIA_QUESTIONS.length - 1) {
      setTriviaGameOver(true);
    } else {
      setTriviaIndex((prev) => prev + 1);
      setTriviaSelectedAnswer(null);
      setTriviaAnswerSubmitted(false);
      setTriviaTimeLeft(15);
    }
  };

  const resetTrivia = () => {
    setTriviaIndex(0);
    setTriviaScore(0);
    setTriviaStreak(0);
    setTriviaSelectedAnswer(null);
    setTriviaAnswerSubmitted(false);
    setTriviaTimeLeft(15);
    setTriviaGameOver(false);
  };

  // ==========================================
  // 2. WORDLE / PALABRA SECRETA STATE
  // ==========================================
  const [wordleTarget, setWordleTarget] = useState<string>(() => {
    return WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)];
  });
  const [wordleGuesses, setWordleGuesses] = useState<string[]>([]);
  const [wordleCurrentInput, setWordleCurrentInput] = useState<string>('');
  const [wordleStatus, setWordleStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  const handleWordleKeyPress = (letter: string) => {
    if (wordleStatus !== 'playing') return;
    if (letter === 'ENTER') {
      if (wordleCurrentInput.length !== 5) return;
      const newGuesses = [...wordleGuesses, wordleCurrentInput];
      setWordleGuesses(newGuesses);
      setWordleCurrentInput('');

      if (wordleCurrentInput === wordleTarget) {
        setWordleStatus('won');
      } else if (newGuesses.length >= 6) {
        setWordleStatus('lost');
      }
    } else if (letter === 'BACKSPACE') {
      setWordleCurrentInput((prev) => prev.slice(0, -1));
    } else {
      if (wordleCurrentInput.length < 5) {
        setWordleCurrentInput((prev) => prev + letter);
      }
    }
  };

  const resetWordle = () => {
    const nextWord = WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)];
    setWordleTarget(nextWord);
    setWordleGuesses([]);
    setWordleCurrentInput('');
    setWordleStatus('playing');
  };

  const getLetterStatus = (letter: string, index: number, word: string) => {
    if (wordleTarget[index] === letter) return 'correct'; // green
    if (wordleTarget.includes(letter)) return 'present'; // yellow
    return 'absent'; // gray
  };

  // Generate Wordle Share Grid
  const getWordleShareGrid = () => {
    const lines = wordleGuesses.map((guess) => {
      return guess
        .split('')
        .map((char, i) => {
          if (wordleTarget[i] === char) return '🟩';
          if (wordleTarget.includes(char)) return '🟨';
          return '⬛';
        })
        .join('');
    });
    return `🎮 Nexus Wordle (${wordleStatus === 'won' ? `${wordleGuesses.length}/6` : 'X/6'}):\n${lines.join('\n')}\n¿Puedes superarme en Nexus Arcade?`;
  };

  // ==========================================
  // 3. CONECTA 4 GAME STATE (7 cols x 6 rows)
  // ==========================================
  const ROWS = 6;
  const COLS = 7;
  const [connectBoard, setConnectBoard] = useState<(number | null)[][]>(() =>
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [connectTurn, setConnectTurn] = useState<number>(1); // 1 = Red (User), 2 = Yellow (AI/Player 2)
  const [connectWinner, setConnectWinner] = useState<number | null>(null);
  const [connectPlayMode, setConnectPlayMode] = useState<'ai' | 'pvp'>('ai');

  const checkConnectWin = (board: (number | null)[][], row: number, col: number, player: number): boolean => {
    const directions = [
      [ [0, 1], [0, -1] ], // Horizontal
      [ [1, 0], [-1, 0] ], // Vertical
      [ [1, 1], [-1, -1] ], // Diagonal down-right / up-left
      [ [1, -1], [-1, 1] ], // Diagonal down-left / up-right
    ];

    for (const [dir1, dir2] of directions) {
      let count = 1;
      // direction 1
      let r = row + dir1[0];
      let c = col + dir1[1];
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
        r += dir1[0];
        c += dir1[1];
      }
      // direction 2
      r = row + dir2[0];
      c = col + dir2[1];
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
        r += dir2[0];
        c += dir2[1];
      }
      if (count >= 4) return true;
    }
    return false;
  };

  const handleDropConnectDisc = (colIndex: number) => {
    if (connectWinner !== null) return;

    // Find lowest available row in this column
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (connectBoard[r][colIndex] === null) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return; // Column full

    const newBoard = connectBoard.map((row) => [...row]);
    newBoard[targetRow][colIndex] = connectTurn;
    setConnectBoard(newBoard);

    if (checkConnectWin(newBoard, targetRow, colIndex, connectTurn)) {
      setConnectWinner(connectTurn);
      return;
    }

    // Switch turn
    const nextTurn = connectTurn === 1 ? 2 : 1;
    setConnectTurn(nextTurn);

    // If AI mode and next turn is 2
    if (connectPlayMode === 'ai' && nextTurn === 2) {
      setTimeout(() => {
        makeAIMove(newBoard);
      }, 500);
    }
  };

  const makeAIMove = (currentBoard: (number | null)[][]) => {
    // 1. Check if AI can win immediately
    for (let c = 0; c < COLS; c++) {
      let r = -1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (currentBoard[row][c] === null) {
          r = row;
          break;
        }
      }
      if (r !== -1) {
        currentBoard[r][c] = 2;
        if (checkConnectWin(currentBoard, r, c, 2)) {
          setConnectBoard(currentBoard);
          setConnectWinner(2);
          return;
        }
        currentBoard[r][c] = null;
      }
    }

    // 2. Check if player 1 is about to win and block them
    for (let c = 0; c < COLS; c++) {
      let r = -1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (currentBoard[row][c] === null) {
          r = row;
          break;
        }
      }
      if (r !== -1) {
        currentBoard[r][c] = 1;
        if (checkConnectWin(currentBoard, r, c, 1)) {
          currentBoard[r][c] = 2;
          setConnectBoard(currentBoard);
          setConnectTurn(1);
          return;
        }
        currentBoard[r][c] = null;
      }
    }

    // 3. Fallback: prefer center columns
    const preferredCols = [3, 2, 4, 1, 5, 0, 6];
    for (const c of preferredCols) {
      let r = -1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (currentBoard[row][c] === null) {
          r = row;
          break;
        }
      }
      if (r !== -1) {
        currentBoard[r][c] = 2;
        setConnectBoard(currentBoard);
        if (checkConnectWin(currentBoard, r, c, 2)) {
          setConnectWinner(2);
        } else {
          setConnectTurn(1);
        }
        return;
      }
    }
  };

  const resetConnect4 = () => {
    setConnectBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setConnectTurn(1);
    setConnectWinner(null);
  };

  // ==========================================
  // 4. REFLEXES TEST STATE
  // ==========================================
  const [reflexState, setReflexState] = useState<'idle' | 'waiting' | 'ready' | 'result' | 'early'>('idle');
  const [reflexStartTime, setReflexStartTime] = useState<number>(0);
  const [reflexResultMs, setReflexResultMs] = useState<number | null>(null);
  const [reflexTimeoutId, setReflexTimeoutId] = useState<any>(null);

  const startReflexTest = () => {
    setReflexState('waiting');
    setReflexResultMs(null);

    const delay = Math.floor(Math.random() * 2500) + 1500; // 1.5s to 4s
    const tid = setTimeout(() => {
      setReflexState('ready');
      setReflexStartTime(Date.now());
    }, delay);

    setReflexTimeoutId(tid);
  };

  const handleReflexClick = () => {
    if (reflexState === 'waiting') {
      // Clicked too early
      clearTimeout(reflexTimeoutId);
      setReflexState('early');
    } else if (reflexState === 'ready') {
      // Measured reaction time
      const timeElapsed = Date.now() - reflexStartTime;
      setReflexResultMs(timeElapsed);
      setReflexState('result');
    } else if (reflexState === 'result' || reflexState === 'early' || reflexState === 'idle') {
      startReflexTest();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-950 text-slate-100">
      {/* 1. Header Bar */}
      <div className="p-4 md:p-6 border-b border-slate-800/80 bg-slate-900/60 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950 shadow-lg font-black">
              <Gamepad2 className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                Nexus Arcade Lounge
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Multijugador & Retos
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Minijuegos en tiempo real para competir, entrenar la mente y retar a tus amigos
              </p>
            </div>
          </div>

          {/* Game Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            {[
              { id: 'trivia', label: 'Nexus Trivia', icon: Brain },
              { id: 'wordle', label: 'Palabra Secreta', icon: Sparkles },
              { id: 'connect4', label: 'Conecta 4', icon: CircleDot },
              { id: 'reflexes', label: 'Reflejos Flash', icon: Zap },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeGame === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveGame(tab.id as ArcadeGame)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Main Game Stage */}
      <div className="max-w-4xl w-full mx-auto p-4 md:p-6 flex-1 flex flex-col justify-center">
        {/* ======================================================== */}
        {/* GAME 1: TRIVIA */}
        {/* ======================================================== */}
        {activeGame === 'trivia' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 space-y-6 shadow-2xl">
            {/* Top Trivia Stats */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  {currentQuestion.category}
                </span>
                <span className="text-xs text-slate-400">
                  Pregunta {triviaIndex + 1} de {TRIVIA_QUESTIONS.length}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                  <Flame className="w-4 h-4" />
                  <span>Racha: x{triviaStreak}</span>
                </div>

                <div className="flex items-center gap-1 text-xs font-black text-emerald-400">
                  <Trophy className="w-4 h-4" />
                  <span>{triviaScore} Puntos</span>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className={triviaTimeLeft <= 5 ? 'text-rose-400 font-black animate-pulse' : ''}>
                    {triviaTimeLeft}s
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar countdown */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  triviaTimeLeft <= 5 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${(triviaTimeLeft / 15) * 100}%` }}
              />
            </div>

            {!triviaGameOver ? (
              <>
                {/* Question Text */}
                <h3 className="text-lg md:text-2xl font-black text-white text-center py-4 leading-snug">
                  {currentQuestion.question}
                </h3>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = triviaSelectedAnswer === idx;
                    const isCorrect = idx === currentQuestion.correctIndex;
                    let btnStyle = 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900';

                    if (triviaAnswerSubmitted) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40';
                      } else if (isSelected) {
                        btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-300';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={triviaAnswerSubmitted}
                        onClick={() => handleTriviaAnswer(idx)}
                        className={`p-4 rounded-2xl border text-sm md:text-base font-bold text-left transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {triviaAnswerSubmitted && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        )}
                        {triviaAnswerSubmitted && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation and Next Button */}
                {triviaAnswerSubmitted && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      💡 <span className="font-bold">Dato clave:</span> {currentQuestion.explanation}
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleNextTrivia}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer"
                      >
                        {triviaIndex >= TRIVIA_QUESTIONS.length - 1 ? 'Ver Resultado Final' : 'Siguiente Pregunta'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Trivia Game Over Screen */
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto text-3xl font-black">
                  🏆
                </div>
                <h3 className="text-2xl font-black text-white">¡Partida de Trivia Completada!</h3>
                <p className="text-base text-slate-300 font-medium">
                  Puntuación final: <span className="text-emerald-400 font-bold">{triviaScore} puntos</span>
                </p>

                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    onClick={resetTrivia}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Jugar de Nuevo
                  </button>
                  <button
                    onClick={() => {
                      const text = `🏆 ¡Acabo de conseguir ${triviaScore} puntos en Nexus Trivia! ¿Crees poder superarme? Reto abierto en Nexus Arcade 🎮⚡`;
                      setChallengeShareText(text);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    Retar a un Amigo en el Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* GAME 2: WORDLE / PALABRA SECRETA */}
        {/* ======================================================== */}
        {activeGame === 'wordle' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 space-y-6 shadow-2xl flex flex-col items-center">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-white">Palabra Secreta Nexus (5 Letras)</h3>
              <p className="text-xs text-slate-400">
                Adivina la palabra oculta en 6 intentos. Verde = posición correcta, Amarillo = presente.
              </p>
            </div>

            {/* Wordle Grid (6 rows x 5 cols) */}
            <div className="grid grid-rows-6 gap-2 my-2">
              {Array(6)
                .fill(null)
                .map((_, rowIndex) => {
                  const isCurrentRow = rowIndex === wordleGuesses.length;
                  const guessWord = wordleGuesses[rowIndex] || (isCurrentRow ? wordleCurrentInput : '');

                  return (
                    <div key={rowIndex} className="grid grid-cols-5 gap-2">
                      {Array(5)
                        .fill(null)
                        .map((_, colIndex) => {
                          const letter = guessWord[colIndex] || '';
                          const isEvaluated = rowIndex < wordleGuesses.length;
                          let tileClass = 'border-slate-800 bg-slate-950/80 text-white';

                          if (isEvaluated) {
                            const status = getLetterStatus(letter, colIndex, guessWord);
                            if (status === 'correct') tileClass = 'bg-emerald-600 border-emerald-500 text-white font-black';
                            else if (status === 'present') tileClass = 'bg-amber-600 border-amber-500 text-white font-black';
                            else tileClass = 'bg-slate-800 border-slate-700 text-slate-400';
                          } else if (letter) {
                            tileClass = 'border-slate-600 bg-slate-900 text-white scale-105';
                          }

                          return (
                            <div
                              key={colIndex}
                              className={`w-11 h-11 md:w-12 md:h-12 rounded-xl border-2 flex items-center justify-center text-lg font-black transition-all ${tileClass}`}
                            >
                              {letter}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
            </div>

            {/* Game Result Banner */}
            {wordleStatus !== 'playing' && (
              <div className="text-center space-y-2 animate-fadeIn">
                <p className="text-sm font-bold text-white">
                  {wordleStatus === 'won' ? (
                    <span className="text-emerald-400">🎉 ¡Felicidades! Has adivinado la palabra.</span>
                  ) : (
                    <span className="text-rose-400">
                      😔 Fin de la partida. La palabra era: <span className="font-black text-white">{wordleTarget}</span>
                    </span>
                  )}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={resetWordle}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Jugar Otra Palabra
                  </button>
                  <button
                    onClick={() => setChallengeShareText(getWordleShareGrid())}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Compartir Resultado
                  </button>
                </div>
              </div>
            )}

            {/* Virtual Keyboard */}
            <div className="space-y-1.5 max-w-md w-full select-none">
              {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-1">
                  {rowIdx === 2 && (
                    <button
                      onClick={() => handleWordleKeyPress('ENTER')}
                      className="px-2.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-white cursor-pointer"
                    >
                      ENTER
                    </button>
                  )}
                  {row.split('').map((letter) => (
                    <button
                      key={letter}
                      onClick={() => handleWordleKeyPress(letter)}
                      className="w-8 md:w-9 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      {letter}
                    </button>
                  ))}
                  {rowIdx === 2 && (
                    <button
                      onClick={() => handleWordleKeyPress('BACKSPACE')}
                      className="px-2.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-white cursor-pointer"
                    >
                      BORRAR
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* GAME 3: CONECTA 4 */}
        {/* ======================================================== */}
        {activeGame === 'connect4' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 space-y-6 shadow-2xl flex flex-col items-center">
            <div className="flex items-center justify-between w-full max-w-md pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white">Conecta 4 Clásico</h3>
                <p className="text-xs text-slate-400">
                  {connectPlayMode === 'ai' ? 'Jugando contra Nexus IA' : 'Modo 2 Jugadores Local'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setConnectPlayMode(connectPlayMode === 'ai' ? 'pvp' : 'ai');
                    resetConnect4();
                  }}
                  className="px-3 py-1 text-[11px] font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  {connectPlayMode === 'ai' ? '🤖 Contra IA' : '👥 2 Jugadores'}
                </button>
                <button
                  onClick={resetConnect4}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Reiniciar tablero"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Turn status */}
            <div className="flex items-center gap-2 text-xs font-bold">
              {connectWinner ? (
                <span className="text-amber-400 text-sm">
                  🏆 ¡Victoria para el Jugador {connectWinner === 1 ? 'Rojo (Tú)' : 'Amarillo'}!
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Turno actual:</span>
                  <span
                    className={`w-4 h-4 rounded-full ${
                      connectTurn === 1 ? 'bg-rose-500' : 'bg-amber-400'
                    }`}
                  />
                  <span>{connectTurn === 1 ? 'Rojo (Tú)' : connectPlayMode === 'ai' ? 'Nexus IA' : 'Amarillo'}</span>
                </div>
              )}
            </div>

            {/* Connect 4 Board */}
            <div className="p-3 md:p-4 rounded-3xl bg-indigo-950 border-4 border-indigo-900 shadow-2xl grid grid-cols-7 gap-2">
              {Array(COLS)
                .fill(null)
                .map((_, colIdx) => (
                  <div
                    key={colIdx}
                    onClick={() => handleDropConnectDisc(colIdx)}
                    className="flex flex-col gap-2 cursor-pointer group"
                  >
                    {/* Hover drop preview */}
                    <div className="w-9 h-3 rounded-full opacity-0 group-hover:opacity-60 bg-white/40 transition-opacity mx-auto" />

                    {Array(ROWS)
                      .fill(null)
                      .map((_, rowIdx) => {
                        const cell = connectBoard[rowIdx][colIdx];
                        let discColor = 'bg-slate-900/90 shadow-inner';
                        if (cell === 1) discColor = 'bg-rose-500 shadow-md ring-2 ring-rose-300';
                        if (cell === 2) discColor = 'bg-amber-400 shadow-md ring-2 ring-amber-200';

                        return (
                          <div
                            key={rowIdx}
                            className={`w-9 h-9 md:w-11 md:h-11 rounded-full border border-indigo-900/80 flex items-center justify-center transition-all ${discColor}`}
                          />
                        );
                      })}
                  </div>
                ))}
            </div>

            {connectWinner && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={resetConnect4}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                >
                  Revancha
                </button>
                <button
                  onClick={() => {
                    const text = `🔴🟡 ¡Acabo de ganar una partida de Conecta 4 en Nexus Arcade! ¿Aceptas el reto de vencerme?`;
                    setChallengeShareText(text);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Compartir Desafío en Chat
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* GAME 4: REFLEJOS FLASH */}
        {/* ======================================================== */}
        {activeGame === 'reflexes' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 space-y-6 shadow-2xl flex flex-col items-center">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-white">Test de Reflejos Flash</h3>
              <p className="text-xs text-slate-400">
                Haz clic en el recuadro tan pronto cambie a color VERDE.
              </p>
            </div>

            {/* Reaction Area */}
            <div
              onClick={handleReflexClick}
              className={`w-full max-w-md h-64 rounded-3xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors duration-100 select-none shadow-2xl ${
                reflexState === 'idle'
                  ? 'bg-slate-900 border-2 border-slate-700 hover:border-slate-600 text-white'
                  : reflexState === 'waiting'
                  ? 'bg-rose-900/90 text-white'
                  : reflexState === 'ready'
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : reflexState === 'early'
                  ? 'bg-amber-900/90 text-amber-200'
                  : 'bg-indigo-950 border-2 border-indigo-500/50 text-white'
              }`}
            >
              {reflexState === 'idle' && (
                <div className="space-y-2">
                  <Zap className="w-12 h-12 text-amber-400 mx-auto" />
                  <p className="text-lg font-black">Haz clic para comenzar el test</p>
                  <p className="text-xs text-slate-400">Prepárate para reaccionar al verde</p>
                </div>
              )}

              {reflexState === 'waiting' && (
                <div className="space-y-2">
                  <p className="text-2xl font-black">Espera al VERDE...</p>
                  <p className="text-xs text-rose-300">¡No hagas clic todavía!</p>
                </div>
              )}

              {reflexState === 'ready' && (
                <div className="space-y-2 animate-pulse">
                  <p className="text-4xl font-black">¡¡¡PULSA YA!!!</p>
                </div>
              )}

              {reflexState === 'early' && (
                <div className="space-y-2">
                  <p className="text-xl font-black">¡Demasiado pronto! ⚠️</p>
                  <p className="text-xs text-amber-300">Pulsaste antes de que saliera el color verde.</p>
                  <p className="text-xs text-slate-400 pt-2">Haz clic para reintentar</p>
                </div>
              )}

              {reflexState === 'result' && reflexResultMs !== null && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {reflexResultMs < 210
                      ? '⚡ Rango: Rayo Gamer'
                      : reflexResultMs < 260
                      ? '🎯 Rango: Reflejo Ninja'
                      : reflexResultMs < 340
                      ? '👍 Rango: Bueno'
                      : '🐢 Rango: Normal'}
                  </span>
                  <p className="text-5xl font-black text-white">{reflexResultMs} ms</p>
                  <p className="text-xs text-slate-400 pt-2">Haz clic para probar de nuevo</p>
                </div>
              )}
            </div>

            {reflexState === 'result' && reflexResultMs && (
              <button
                onClick={() => {
                  const text = `⚡ ¡Tiempo de reacción en Nexus Flash: ${reflexResultMs} milisegundos! ¿Tienes los reflejos para superarme? Reto disponible en Nexus Arcade 🕹️`;
                  setChallengeShareText(text);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Retar al Chat con tu Tiempo
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Challenge Share Modal */}
      {challengeShareText && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Swords className="w-4 h-4 text-emerald-400" />
                Retar a un Contacto o Grupo
              </h3>
              <button
                onClick={() => setChallengeShareText(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 whitespace-pre-line">
              {challengeShareText}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              <p className="text-[11px] font-semibold text-slate-400">Selecciona dónde enviar el reto:</p>
              {chats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSendMessageToChat(c.id, challengeShareText);
                    setChallengeShareText(null);
                    if (onNavigateToChat) onNavigateToChat(c.id);
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800 flex items-center gap-3 transition-colors text-left cursor-pointer"
                >
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-8 h-8 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                  <div className="truncate flex-1">
                    <p className="text-xs font-bold text-white truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {c.type === 'group' ? 'Grupo' : 'Chat Directo'}
                    </p>
                  </div>
                  <Send className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

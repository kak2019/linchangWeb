"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLenis } from "lenis/react";
import BrandLogo from "@/components/brand-logo";
import { createPoetryRound, gradePoetryAnswer, normalizePoetryAnswer, poetryDifficulties, type PoetryDifficulty, type PoetryDirection, type PoetryQuestion, type PoetryResult } from "@/lib/poetry-challenge";
import { poetryPairs, poetryPoems } from "@/lib/poetry-question-bank";

type Round = { questions: PoetryQuestion[]; index: number; results: (PoetryResult | null)[]; draft: string; hint: boolean; error: string; complete: boolean; review: boolean };
function newRound(questions: PoetryQuestion[], review = false): Round {
  return { questions, index: 0, results: questions.map(() => null), draft: "", hint: false, error: "", complete: false, review };
}
const seed = () => Math.floor(Math.random() * 4294967296);

export default function PoetryChallenge() {
  const [difficulty, setDifficulty] = useState<PoetryDifficulty>("easy");
  const [direction, setDirection] = useState<PoetryDirection>("next");
  const [round, setRound] = useState(() => newRound(createPoetryRound("easy", "next", 20261103)));
  const workspace = useRef<HTMLElement>(null);
  const lenis = useLenis();
  const question = round.questions[round.index];
  const result = round.results[round.index];
  const level = poetryDifficulties.find(item => item.id === difficulty)!;
  const score = round.results.reduce((sum, item) => sum + (item?.points || 0), 0);
  const answered = round.results.filter(Boolean).length;
  const correct = round.results.filter(item => item?.correct).length;
  const independent = round.results.filter(item => item?.correct && !item.assisted).length;
  const mistakes = round.questions.filter((_, index) => round.results[index] && !round.results[index]!.correct);
  const askPrevious = question.direction === "previous";
  const instruction = askPrevious ? "请接上一句" : "请接下一句";

  useEffect(() => { lenis?.resize(); }, [lenis, round.index, round.complete, round.hint, round.results, difficulty]);

  function scrollToQuestion() {
    requestAnimationFrame(() => {
      if (!workspace.current) return;
      if (lenis) { lenis.resize(); lenis.scrollTo(workspace.current, { offset: -20 }); }
      else workspace.current.scrollIntoView({ block: "start" });
    });
  }

  function restart(nextDifficulty = difficulty, nextDirection = direction) {
    setDifficulty(nextDifficulty); setDirection(nextDirection);
    setRound(newRound(createPoetryRound(nextDifficulty, nextDirection, seed())));
    scrollToQuestion();
  }

  function submit(value: string, skipped = false) {
    setRound(current => {
      if (current.complete || current.results[current.index]) return current;
      if (!skipped && !normalizePoetryAnswer(value)) return { ...current, error: "先接一句试试，也可以点击“先看答案”学习这一句。" };
      const results = [...current.results];
      results[current.index] = gradePoetryAnswer(current.questions[current.index], value, current.hint, skipped);
      return { ...current, results, error: "" };
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); submit(round.draft); }

  function advance() {
    setRound(current => {
      if (!current.results[current.index]) return current;
      return current.index === current.questions.length - 1 ? { ...current, complete: true } : { ...current, index: current.index + 1, draft: "", hint: false, error: "" };
    });
    scrollToQuestion();
  }

  function retryMistakes() {
    if (!mistakes.length) return;
    setRound(newRound(mistakes, true));
    scrollToQuestion();
  }

  function verseLine(which: "upper" | "lower") {
    const missing = which === (askPrevious ? "upper" : "lower");
    return <div className={`poetry-verse-line${missing ? " is-missing" : ""}`}>
      <span>{which === "upper" ? "上句" : "下句"}</span>
      {missing && !result ? difficulty === "easy" ? <p className="poetry-missing-line">待你来接 <i aria-hidden="true">···</i></p> : <label className="poetry-answer-input"><span className="poetry-sr-only">{askPrevious ? "请输入上一句" : "请输入下一句"}</span><input value={round.draft} onChange={event => setRound(current => ({ ...current, draft: event.target.value, error: "" }))} onKeyDown={event => { if (event.key === "Enter" && event.nativeEvent.isComposing) event.preventDefault(); }} placeholder={askPrevious ? "在这里写下上一句" : "在这里写下下一句"} maxLength={80} autoComplete="off" spellCheck={false} aria-invalid={Boolean(round.error)} aria-describedby="poetry-answer-help" /></label> : <p>{question[which]}<span className="poetry-verse-punctuation">{which === "upper" ? "，" : "。"}</span></p>}
    </div>;
  }

  return <div className="poetry-app">
    <header className="poetry-topbar"><Link href="/teacher-ecosystem/" className="poetry-brand"><BrandLogo size={32} /><span>临场 <i>/</i> 教师工具</span></Link><Link href="/teacher-ecosystem/">返回资源广场 <span aria-hidden="true">↗</span></Link></header>
    <main className="poetry-main">
      <section className="poetry-intro"><div><span className="poetry-eyebrow">ONE VERSE LEADS TO ANOTHER</span><h1>诗词接龙 <span>上下句闯关</span><i aria-hidden="true">✳</i></h1><p>你一句，我一句，把读过的诗重新想起。</p></div><span>{poetryPoems.length} 首诗词 / {poetryPairs.length} 组上下句</span></section>

      <section className="poetry-config" aria-label="诗词挑战设置"><div className="poetry-levels" role="group" aria-label="挑战难度">{poetryDifficulties.map(item => <button type="button" key={item.id} aria-pressed={difficulty === item.id} onClick={() => { if (difficulty !== item.id) restart(item.id); }}><strong>{item.title}</strong><small>{item.caption}</small></button>)}</div><div className="poetry-config-actions"><label>接句方向<select aria-label="接句方向" value={direction} onChange={event => restart(difficulty, event.target.value as PoetryDirection)}><option value="next">接下句</option><option value="previous">接上句</option><option value="mixed">上下句混合</option></select></label><button type="button" onClick={() => restart()}>换一轮 <span aria-hidden="true">↻</span></button></div><p>切换难度或方向会开始新一轮。{level.description}</p></section>

      <section className="poetry-workspace" ref={workspace} aria-label="诗词闯关练习">
        {round.complete ? <section className="poetry-summary" aria-labelledby="poetry-summary-title"><span className="poetry-summary-seal" aria-hidden="true">诗</span><p className="poetry-eyebrow">A FEW MORE VERSES TO KEEP</p><h2 id="poetry-summary-title">{round.review ? "错题又练了一遍" : "十关走完，诗意留下"}</h2><p className="poetry-summary-description">{correct === round.questions.length ? "这一轮全部接上了。换一轮，和更多诗句重逢。" : "接上的句子留在心里，没接上的句子再读一遍。"}</p><div className="poetry-summary-stats"><div><strong>{score}<small>/ {round.questions.length * 10}</small></strong><span>本轮积分</span></div><div><strong>{correct}<small>/ {round.questions.length}</small></strong><span>正确题数</span></div><div><strong>{independent}<small>题</small></strong><span>独立答对</span></div></div><div className="poetry-summary-actions">{mistakes.length > 0 && <button type="button" className="poetry-primary" onClick={retryMistakes}>重练 {mistakes.length} 道错题 ↗</button>}<button type="button" className={mistakes.length ? "poetry-secondary" : "poetry-primary"} onClick={() => restart()}>再开一轮 ↻</button></div><details className="poetry-round-record"><summary>查看本轮答题记录 <span>{round.questions.length} 题</span></summary><ol>{round.questions.map((item, index) => {
          const record = round.results[index]!;
          return <li key={item.id}><span className={record.correct ? "poetry-record-correct" : "poetry-record-missed"}>{record.correct ? "✓" : "○"}</span><div><p>{item.upper}，{item.lower}。</p><span>《{item.title}》 · {item.author}{record.assisted ? " · 使用提示" : ""}{record.skipped ? " · 查看了答案" : !record.correct ? ` · 你的答案：${record.submitted}` : ""}</span><a href={item.source} target="_blank" rel="noreferrer">原文参考 ↗</a></div><strong>+{record.points}</strong></li>;
        })}</ol></details></section> : <article className="poetry-question-card">
          <div className="poetry-question-top"><span>{round.review ? "错题重练" : "诗词挑战"} <i>/</i> {level.title}</span><strong aria-live="polite">第 {String(round.index + 1).padStart(2, "0")} 关 <small>/ {round.questions.length}</small></strong></div>
          <div className="poetry-question-heading"><span className="poetry-task-label">{instruction}</span><h2>{difficulty === "hard" && !result ? "藏起出处，凭记忆接一句" : `《${question.title}》`}</h2><p>{difficulty === "hard" && !result ? "作答后揭晓篇目与作者" : question.author}</p></div>
          <form onSubmit={onSubmit}>
            <div className="poetry-couplet" role="group" aria-label="补全这组诗句">{verseLine("upper")}<div className="poetry-verse-divider" aria-hidden="true"><span>✳</span></div>{verseLine("lower")}</div>
            {!result && <>
              {difficulty === "easy" ? <div className="poetry-answer-options" role="group" aria-label="选择相接的诗句">{question.options.map((option, index) => <button type="button" key={option} onClick={() => submit(option)}><span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong><i aria-hidden="true">↗</i></button>)}</div> : <p className="poetry-answer-help" id="poetry-answer-help">用简体填写，标点和空格不影响判断。</p>}
              {round.hint && <p className="poetry-hint" role="status">首字是“{Array.from(normalizePoetryAnswer(question.answer))[0]}”，这一句共 {Array.from(normalizePoetryAnswer(question.answer)).length} 字。使用提示后答对得 5 分。</p>}
              {round.error && <p className="poetry-input-error" role="alert">{round.error}</p>}
              <div className="poetry-question-actions"><button type="button" className="poetry-skip" onClick={() => submit("", true)}>先看答案</button>{difficulty !== "easy" && <><button type="button" className="poetry-hint-button" disabled={round.hint} onClick={() => setRound(current => ({ ...current, hint: true }))}>{round.hint ? "已给首字提示" : "给点提示"}</button><button type="submit" className="poetry-primary">我接好了 <span aria-hidden="true">↗</span></button></>}</div>
            </>}
          </form>
          {result && <div className={`poetry-feedback${result.correct ? " is-correct" : " is-learning"}`}><div role="status"><strong>{result.correct ? `接上了！+${result.points} 分` : result.skipped ? "读一遍，下次试着接上" : "这句再记一遍"}</strong><p>正确接句：<span>{question.answer}</span></p>{!result.correct && !result.skipped && <p className="poetry-your-answer">你的答案：{result.submitted}</p>}{question.note && <p className="poetry-variant-note">{question.note}</p>}<a href={question.source} target="_blank" rel="noreferrer">《{question.title}》 · {question.author} · 原文参考 ↗</a></div><button type="button" className="poetry-primary" onClick={advance}>{round.index === round.questions.length - 1 ? "查看本轮战绩" : "下一关"} <span aria-hidden="true">→</span></button></div>}
          <p className="poetry-question-footnote">不赶时间，想起来的每一句都算收获。</p>
        </article>}

        <aside className="poetry-route" aria-label="本轮闯关进度"><div className="poetry-route-heading"><h2>{round.review ? "重练路线" : "闯关路线"}</h2><span>{answered} / {round.questions.length}</span></div><ol className="poetry-route-map">{round.questions.map((item, index) => {
          const record = round.results[index];
          return <li key={item.id} className={`${record ? record.correct ? "is-passed" : "is-missed" : ""}${!round.complete && index === round.index ? " is-current" : ""}`} aria-current={!round.complete && index === round.index ? "step" : undefined}><span aria-hidden="true">{record ? record.correct ? "✓" : "·" : String(index + 1).padStart(2, "0")}</span><small>第 {index + 1} 关</small><span className="poetry-sr-only">{record ? record.correct ? "已答对" : "待复习" : "未作答"}</span></li>;
        })}</ol><div className="poetry-score"><div><span>累计积分</span><strong>{score}<small>分</small></strong></div><div><span>接对诗句</span><strong>{correct}<small>题</small></strong></div></div><div className="poetry-route-note"><span aria-hidden="true">✳</span><p>独立答对 10 分<br />提示后答对 5 分<br />没接上，回头再练一遍。</p></div></aside>
      </section>
      <footer className="poetry-footer"><span>从一首熟悉的诗，走向更多诗意。</span><span>题库采用常见诵读版本，作答后可查看原文来源。</span></footer>
    </main>
  </div>;
}

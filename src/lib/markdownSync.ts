import JSZip from 'jszip';
import {
  DailyReview,
  Goal,
  KnowledgeItem,
  LifeEvent,
  LifeState,
  Principle,
  TodoItem,
  TrajectoryPattern,
  UserPhaseMeta,
  Vision,
} from '../types';
import { Storage } from './storage';

export interface AllLifeOSData {
  phase: UserPhaseMeta;
  visions: Vision[];
  principles: Principle[];
  goals: Goal[];
  todos: TodoItem[];
  reviews: DailyReview[];
  events: LifeEvent[];
  states: LifeState[];
  knowledge: KnowledgeItem[];
  patterns: TrajectoryPattern[];
}

export function getAllLifeOSData(): AllLifeOSData {
  return {
    phase: Storage.getPhase(),
    visions: Storage.getVisions(),
    principles: Storage.getPrinciples(),
    goals: Storage.getGoals(),
    todos: Storage.getTodos(),
    reviews: Storage.getReviews(),
    events: Storage.getEvents(),
    states: Storage.getStates(),
    knowledge: Storage.getKnowledgeItems(),
    patterns: Storage.getPatterns(),
  };
}

// ==========================================
// 1. Markdown Generators
// ==========================================

export function generateUserPhaseMarkdown(phase: UserPhaseMeta): string {
  return `---
title: 当前人生阶段与主线
type: user_phase
updatedAt: ${new Date().toISOString().split('T')[0]}
---

# 🧭 当前人生阶段与主线锚点

- **当前阶段 (Current Phase)**: ${phase.currentPhase || '未设置'}
- **核心主线任务 (Main Quest)**: ${phase.mainQuest || '未设置'}
- **近期关键转变 (Key Shift)**: ${phase.keyRecentShift || '未设置'}
- **显化与进展证据 (Recent Progress)**: ${phase.recentProgress || '未设置'}

> *“用户负责生活，AI 负责理解生活 · 不要为了系统而生活”*
`;
}

export function generateVisionsMarkdown(visions: Vision[]): string {
  let md = `---
title: 核心愿景 (Visions)
type: visions
count: ${visions.length}
updatedAt: ${new Date().toISOString().split('T')[0]}
---

# 🎯 核心愿景 (Visions)

`;
  visions.forEach((v, index) => {
    md += `## ${index + 1}. [${v.category}] ${v.title}
- **ID**: \`${v.id}\`
- **愿景叙事**: ${v.statement}
- **创建时间**: ${v.createdAt}

`;
  });
  return md;
}

export function generatePrinciplesMarkdown(principles: Principle[]): string {
  let md = `---
title: 人生原则与核心信念 (Principles)
type: principles
count: ${principles.length}
updatedAt: ${new Date().toISOString().split('T')[0]}
---

# 📜 人生原则与核心信念 (Principles)

`;
  principles.forEach((p, index) => {
    md += `## ${index + 1}. ${p.statement}
- **ID**: \`${p.id}\`
- **分类**: \`${p.category}\`
- **底层原因 (Why)**: ${p.why}
- **创建时间**: ${p.createdAt}

`;
  });
  return md;
}

export function generateGoalsMarkdown(goals: Goal[]): string {
  let md = `---
title: 目标与现实证据库 (Goals & Evidence)
type: goals
count: ${goals.length}
updatedAt: ${new Date().toISOString().split('T')[0]}
---

# 🏆 目标与现实证据库 (Goals & Evidence)

`;
  goals.forEach((g, index) => {
    md += `## ${index + 1}. ${g.title} (${g.type === 'short_term' ? '短期' : '长期'}) [${g.status}]
- **ID**: \`${g.id}\`
- **当前进度**: ${g.progressPercent}%
- **现实要做什么 (Reality)**: ${g.reality}
- **为什么想要 (Why)**: ${g.why}
- **我正在成为谁 (Identity)**: ${g.identity}
- **核心信念 (Core Belief)**: ${g.coreBelief}
- **愿景连接 (Vision Connection)**: ${g.visionConnection}
- **显化积极叙事 (Manifestation)**: ${g.manifestationNarrative}

### 现实证据积累 (${g.evidence?.length || 0}条)
${(g.evidence || []).map((e) => `- ✅ ${e}`).join('\n')}

---
`;
  });
  return md;
}

export function generateTodosMarkdown(todos: TodoItem[]): string {
  const pending = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  let md = `---
title: 短期待办与行动清单 (Todos)
type: todos
pendingCount: ${pending.length}
completedCount: ${completed.length}
updatedAt: ${new Date().toISOString().split('T')[0]}
---

# 📋 短期待办与行动清单 (Todos)

## ⏳ 进行中待办 (${pending.length})
`;
  if (pending.length === 0) {
    md += `*暂无进行中的待办事项*\n\n`;
  } else {
    pending.forEach((t) => {
      md += `- [ ] **${t.title}** (领域: \`${t.area}\` | 预估: \`${t.estimatedMinutes || 30}m\` | 优先级: \`${t.priority || 'medium'}\` | 日期: \`${t.date}\` | ID: \`${t.id}\`)\n`;
    });
    md += '\n';
  }

  md += `## ✅ 已完成待办 (${completed.length})\n`;
  if (completed.length === 0) {
    md += `*暂无已完成的待办事项*\n\n`;
  } else {
    completed.forEach((t) => {
      const bridged = t.convertedToEventId ? ` | 🔗 已衔接事件: \`${t.convertedToEventId}\`` : '';
      md += `- [x] **${t.title}** (领域: \`${t.area}\` | 完成时间: \`${t.completedAt || t.date}\`${bridged} | ID: \`${t.id}\`)\n`;
    });
    md += '\n';
  }
  return md;
}

export function generateDailyReviewMarkdown(review: DailyReview): string {
  return `---
title: ${review.date} 晚间日结复盘
date: ${review.date}
type: daily_review
alignmentScore: ${review.innerCompass?.alignmentScore || 0}
confirmed: ${review.confirmedData}
createdAt: ${review.createdAt}
---

# 🌙 ${review.date} 晚间日结复盘

> **内在指南针契合度**: ${review.innerCompass?.alignmentScore || 8} / 10
> - 身体愿意做: ${review.innerCompass?.bodyWilling ? '✅ 是' : '❌ 否'}
> - 内心平静: ${review.innerCompass?.heartPeaceful ? '✅ 是' : '❌ 否'}
> - 主动选择: ${review.innerCompass?.proactiveChoice ? '✅ 是' : '❌ 否'}
> - 直面现实: ${review.innerCompass?.facingReality ? '✅ 是' : '❌ 否'}
> - 感到更完整: ${review.innerCompass?.moreComplete ? '✅ 是' : '❌ 否'}

---

## 1. 📅 今日发生 (纯事实汇总)
${(review.eventsSummary || []).map((e) => `- ${e}`).join('\n') || '*无事实记录*'}

## 2. 🌟 今日成功 (具体现实证据)
${(review.successes || []).map((s) => `- ✅ ${s}`).join('\n') || '*无*'}

## 3. 🌸 今日感恩 (真实细节)
${(review.gratitudes || []).map((g) => `- 🙏 ${g}`).join('\n') || '*无*'}

## 4. 🧩 今日整合 (身心与行为连接)
${(review.integrations || []).map((i) => `- 💡 ${i}`).join('\n') || '*无*'}

## 5. 🔍 今日盲区与温柔觉察
${(review.blindSpots || []).map((b) => `- 🧐 ${b}`).join('\n') || '*无*'}

## 6. 🎯 目标与愿景连接
${(review.goalConnections || []).map((gc) => `- 🔗 ${gc}`).join('\n') || '*无*'}

## 7. ✨ 显化叙事与宇宙同步
${review.manifestationNarrative || '*暂无显化叙事*'}

---
*复盘笔记*: ${review.innerCompass?.reflectionNotes || '无特殊备注'}
`;
}

export function generateEventsMarkdown(events: LifeEvent[]): string {
  let md = `---
title: 生活事件簿 (Life Events)
type: events
count: ${events.length}
updatedAt: ${new Date().toISOString().split('T')[0]}
---

# 📖 生活事件簿 (Life Events)

| 日期 | 时间 | 领域 | 事项事实描述 | 分类/子类 | 时长 | 原始表达 (Raw Note) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;
  events.forEach((e) => {
    const timeStr = e.time_start ? `${e.time_start}${e.time_end ? `-${e.time_end}` : ''}` : '-';
    const cleanDesc = (e.description || '').replace(/\|/g, '/');
    const cleanRaw = (e.raw_note || '').replace(/\|/g, '/').replace(/\n/g, ' ');
    md += `| ${e.date} | ${timeStr} | ${e.area} | ${cleanDesc} | ${e.category || ''}${e.subcategory ? `/${e.subcategory}` : ''} | ${e.duration_display || (e.duration_minutes ? `${e.duration_minutes}m` : '-')} | ${cleanRaw} |\n`;
  });
  return md;
}

export function generateStatesMarkdown(states: LifeState[]): string {
  let md = `---
title: 身心状态与能量记录 (Life States)
type: states
count: ${states.length}
updatedAt: ${new Date().toISOString().split('T')[0]}
---

# 🫀 身心状态与能量流水 (Life States)

| 日期 | 时间 | 主导情绪 | 能量等级 (1-5) | 情境与觉察 | 原始表达 (Raw Note) | 指南针契合 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;
  states.forEach((s) => {
    const cleanContext = (s.contextDescription || '').replace(/\|/g, '/');
    const cleanRaw = (s.rawNote || '').replace(/\|/g, '/').replace(/\n/g, ' ');
    md += `| ${s.date} | ${s.timestamp} | ${s.primaryMood} | ${'⚡'.repeat(s.energyLevel || 3)} (${s.energyLevel}/5) | ${cleanContext} | ${cleanRaw} | ${s.innerCompassAligned ? '✅ 契合' : '⚠️ 需关注'} |\n`;
  });
  return md;
}

export function generateKnowledgeMarkdown(knowledge: KnowledgeItem[]): string {
  let md = `---
title: 外脑知识库与思维模型 (Knowledge Vault)
type: knowledge
count: ${knowledge.length}
updatedAt: ${new Date().toISOString().split('T')[0]}
---

# 🧠 外脑知识库与思维模型 (Knowledge Vault)

`;
  knowledge.forEach((k, index) => {
    md += `## ${index + 1}. [${k.category}] ${k.title}
- **ID**: \`${k.id}\`
- **来源**: \`${k.source}\`
- **标签**: ${k.tags?.map((t) => `#${t}`).join(' ') || '无'}
- **沉淀时间**: ${k.createdAt}

### 核心内容
${k.content}

---
`;
  });
  return md;
}

export function generatePatternsMarkdown(patterns: TrajectoryPattern[]): string {
  let md = `---
title: 长期生活模式与闭环洞察 (Trajectory Patterns)
type: patterns
count: ${patterns.length}
updatedAt: ${new Date().toISOString().split('T')[0]}
---

# 📈 长期生活模式与闭环洞察 (Trajectory Patterns)

`;
  patterns.forEach((p, index) => {
    md += `## ${index + 1}. ${p.title} [${p.trendStatus}]
- **ID**: \`${p.id}\`
- **生活领域**: \`${p.lifeArea}\`
- **出现频次**: ${p.frequencyCount} 次 (观察周期: ${p.firstObservedDate} 至 ${p.lastObservedDate})
- **触发情境**: ${p.triggerEvent}
- **过去的反应闭环**: ${p.observedLoop}
- **AI 建议的破局转变**: ${p.shiftSuggested}

---
`;
  });
  return md;
}

export function generateAllInOneMarkdown(data: AllLifeOSData): string {
  return `# 🌌 LifeOS 全量生活操作系统档案

> 生成时间: ${new Date().toLocaleString()}  
> 核心理念: 用户只管生活和表达，AI 负责记录、理解与发现长期轨迹

---

${generateUserPhaseMarkdown(data.phase)}

---

${generateVisionsMarkdown(data.visions)}

---

${generatePrinciplesMarkdown(data.principles)}

---

${generateGoalsMarkdown(data.goals)}

---

${generateTodosMarkdown(data.todos)}

---

# 🌙 每日复盘记录汇总 (${data.reviews.length}篇)

${data.reviews.map((r) => generateDailyReviewMarkdown(r)).join('\n\n---\n\n')}

---

${generateEventsMarkdown(data.events)}

---

${generateStatesMarkdown(data.states)}

---

${generateKnowledgeMarkdown(data.knowledge)}

---

${generatePatternsMarkdown(data.patterns)}
`;
}

// ==========================================
// 2. Export ZIP / File Actions
// ==========================================

export async function exportLifeOSMarkdownZip(): Promise<void> {
  const data = getAllLifeOSData();
  const zip = new JSZip();

  // Root README
  zip.file(
    'README.md',
    `# LifeOS Markdown 知识库归档\n\n- 归档生成日期: ${new Date().toISOString().split('T')[0]}\n- 包含模块: 人生阶段与指南针、愿景目标、短期待办、每日复盘、生活事件簿、身心状态流水、外脑知识库与长期轨迹模式。\n- 兼容性: 完美适配 Obsidian, Logseq, Notion, VSCode Markdown。\n`
  );

  // 00_指南针与愿景原则
  const compassFolder = zip.folder('00_指南针与愿景原则');
  compassFolder?.file('01_人生阶段_UserPhase.md', generateUserPhaseMarkdown(data.phase));
  compassFolder?.file('02_核心愿景_Visions.md', generateVisionsMarkdown(data.visions));
  compassFolder?.file('03_人生原则_Principles.md', generatePrinciplesMarkdown(data.principles));

  // 01_目标与证据库
  const goalsFolder = zip.folder('01_目标与证据库');
  goalsFolder?.file('目标与现实证据_Goals.md', generateGoalsMarkdown(data.goals));

  // 02_短期待办
  const todosFolder = zip.folder('02_短期待办');
  todosFolder?.file('短期待办清单_Todos.md', generateTodosMarkdown(data.todos));

  // 03_每日复盘 (按日期分文件)
  const reviewsFolder = zip.folder('03_每日复盘');
  data.reviews.forEach((r) => {
    reviewsFolder?.file(`${r.date}_晚间日结.md`, generateDailyReviewMarkdown(r));
  });

  // 04_生活事件簿
  const eventsFolder = zip.folder('04_生活事件簿');
  eventsFolder?.file('生活事件总览_Events.md', generateEventsMarkdown(data.events));

  // 05_身心状态记录
  const statesFolder = zip.folder('05_身心状态记录');
  statesFolder?.file('身心状态与能量流水_States.md', generateStatesMarkdown(data.states));

  // 06_外脑知识库
  const knowledgeFolder = zip.folder('06_外脑知识库');
  knowledgeFolder?.file('外脑知识库汇总_Knowledge.md', generateKnowledgeMarkdown(data.knowledge));
  data.knowledge.forEach((k) => {
    const safeTitle = (k.title || '条目').replace(/[\\/:*?"<>|]/g, '_').slice(0, 30);
    knowledgeFolder?.file(
      `知识卡片_${safeTitle}.md`,
      `---\ntitle: "${k.title}"\ncategory: ${k.category}\nsource: ${k.source}\ncreatedAt: ${k.createdAt}\n---\n\n# ${k.title}\n\n${k.content}\n`
    );
  });

  // 07_长期轨迹与模式
  const patternsFolder = zip.folder('07_长期轨迹与模式');
  patternsFolder?.file('生活模式与闭环_Patterns.md', generatePatternsMarkdown(data.patterns));

  // All-in-one backup file inside
  zip.file('LifeOS_全量生活档案_汇总.md', generateAllInOneMarkdown(data));

  // Generate blob and download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LifeOS_Markdown全景档案_${new Date().toISOString().split('T')[0]}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportLifeOSSingleMarkdown(): void {
  const data = getAllLifeOSData();
  const md = generateAllInOneMarkdown(data);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LifeOS_全量生活档案_${new Date().toISOString().split('T')[0]}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==========================================
// 3. Import Markdown / Zip Parser
// ==========================================

export async function importLifeOSFromMarkdownZip(file: File): Promise<{
  success: boolean;
  message: string;
  counts?: Record<string, number>;
}> {
  try {
    const zip = await JSZip.loadAsync(file);
    const counts: Record<string, number> = {};

    // 1. Check for All-in-One or individual markdown files
    const allFiles = Object.keys(zip.files).filter(
      (path) => path.endsWith('.md') && !zip.files[path].dir
    );

    if (allFiles.length === 0) {
      return { success: false, message: '压缩包中未找到任何 .md 文件' };
    }

    let parsedTodos: TodoItem[] = [];
    let parsedEvents: LifeEvent[] = [];
    let parsedStates: LifeState[] = [];
    let parsedReviews: DailyReview[] = [];
    let parsedKnowledge: KnowledgeItem[] = [];
    let parsedGoals: Goal[] = [];
    let parsedPrinciples: Principle[] = [];
    let parsedVisions: Vision[] = [];
    let parsedPhase: UserPhaseMeta | null = null;

    for (const filePath of allFiles) {
      const content = await zip.files[filePath].async('text');

      // User Phase
      if (filePath.includes('UserPhase') || content.includes('type: user_phase')) {
        const phase = parseUserPhaseMarkdown(content);
        if (phase) parsedPhase = phase;
      }

      // Todos
      if (filePath.includes('Todos') || content.includes('type: todos')) {
        const todos = parseTodosMarkdown(content);
        if (todos.length > 0) parsedTodos = [...parsedTodos, ...todos];
      }

      // Daily Reviews
      if (filePath.includes('日结') || filePath.includes('复盘') || content.includes('type: daily_review')) {
        const review = parseDailyReviewMarkdown(content);
        if (review) parsedReviews.push(review);
      }

      // Events
      if (filePath.includes('Events') || content.includes('type: events')) {
        const events = parseEventsMarkdown(content);
        if (events.length > 0) parsedEvents = [...parsedEvents, ...events];
      }

      // Knowledge
      if (filePath.includes('Knowledge') || content.includes('type: knowledge')) {
        const knowledge = parseKnowledgeMarkdown(content);
        if (knowledge.length > 0) parsedKnowledge = [...parsedKnowledge, ...knowledge];
      }

      // Goals
      if (filePath.includes('Goals') || content.includes('type: goals')) {
        const goals = parseGoalsMarkdown(content);
        if (goals.length > 0) parsedGoals = [...parsedGoals, ...goals];
      }

      // Principles
      if (filePath.includes('Principles') || content.includes('type: principles')) {
        const principles = parsePrinciplesMarkdown(content);
        if (principles.length > 0) parsedPrinciples = [...parsedPrinciples, ...principles];
      }

      // Visions
      if (filePath.includes('Visions') || content.includes('type: visions')) {
        const visions = parseVisionsMarkdown(content);
        if (visions.length > 0) parsedVisions = [...parsedVisions, ...visions];
      }
    }

    // Save whatever was parsed
    if (parsedPhase) {
      Storage.savePhase(parsedPhase);
      counts['人生阶段'] = 1;
    }
    if (parsedTodos.length > 0) {
      Storage.saveTodos(parsedTodos);
      counts['短期待办'] = parsedTodos.length;
    }
    if (parsedReviews.length > 0) {
      Storage.saveReviews(parsedReviews);
      counts['每日复盘'] = parsedReviews.length;
    }
    if (parsedEvents.length > 0) {
      Storage.saveEvents(parsedEvents);
      counts['生活事件'] = parsedEvents.length;
    }
    if (parsedStates.length > 0) {
      Storage.saveStates(parsedStates);
      counts['身心状态'] = parsedStates.length;
    }
    if (parsedKnowledge.length > 0) {
      Storage.saveKnowledgeItems(parsedKnowledge);
      counts['知识库条目'] = parsedKnowledge.length;
    }
    if (parsedGoals.length > 0) {
      Storage.saveGoals(parsedGoals);
      counts['目标与证据'] = parsedGoals.length;
    }
    if (parsedPrinciples.length > 0) {
      Storage.savePrinciples(parsedPrinciples);
      counts['人生原则'] = parsedPrinciples.length;
    }
    if (parsedVisions.length > 0) {
      Storage.saveVisions(parsedVisions);
      counts['愿景'] = parsedVisions.length;
    }

    const summaryParts = Object.entries(counts).map(([k, v]) => `${k}: ${v}项`);
    return {
      success: true,
      message: summaryParts.length > 0 ? `成功从 Markdown ZIP 导入：${summaryParts.join(', ')}` : '未识别出有效的 Markdown 数据结构',
      counts,
    };
  } catch (err: any) {
    console.error('Failed to import markdown zip', err);
    return { success: false, message: `解析 ZIP 失败: ${err.message || err}` };
  }
}

export function importLifeOSFromMarkdownText(content: string): {
  success: boolean;
  message: string;
} {
  try {
    let importedTypes: string[] = [];

    // Parse Phase
    const phase = parseUserPhaseMarkdown(content);
    if (phase && phase.currentPhase) {
      Storage.savePhase(phase);
      importedTypes.push('人生阶段');
    }

    // Parse Todos
    const todos = parseTodosMarkdown(content);
    if (todos.length > 0) {
      Storage.saveTodos(todos);
      importedTypes.push(`待办 (${todos.length}项)`);
    }

    // Parse Daily Review
    const review = parseDailyReviewMarkdown(content);
    if (review && review.date) {
      Storage.saveDailyReview(review);
      importedTypes.push(`复盘 (${review.date})`);
    }

    // Parse Knowledge
    const knowledge = parseKnowledgeMarkdown(content);
    if (knowledge.length > 0) {
      Storage.saveKnowledgeItems(knowledge);
      importedTypes.push(`知识条目 (${knowledge.length}项)`);
    }

    // Parse Events
    const events = parseEventsMarkdown(content);
    if (events.length > 0) {
      Storage.saveEvents(events);
      importedTypes.push(`生活事件 (${events.length}条)`);
    }

    if (importedTypes.length === 0) {
      return { success: false, message: '未能在 Markdown 文本中提取到结构化 LifeOS 数据' };
    }

    return {
      success: true,
      message: `Markdown 导入成功，已更新：${importedTypes.join('、')}`,
    };
  } catch (err: any) {
    return { success: false, message: `解析 Markdown 失败: ${err.message || err}` };
  }
}

// ==========================================
// 4. Helper Parsers
// ==========================================

function parseUserPhaseMarkdown(text: string): UserPhaseMeta | null {
  const currentPhaseMatch = text.match(/当前阶段.*?:?\s*\*\*?(.*?)\*\*?(\n|$)/i) || text.match(/Current Phase.*?:?\s*\*\*?(.*?)\*\*?(\n|$)/i);
  const mainQuestMatch = text.match(/核心主线任务.*?:?\s*\*\*?(.*?)\*\*?(\n|$)/i) || text.match(/Main Quest.*?:?\s*\*\*?(.*?)\*\*?(\n|$)/i);
  const shiftMatch = text.match(/近期关键转变.*?:?\s*\*\*?(.*?)\*\*?(\n|$)/i);
  const progressMatch = text.match(/显化与进展证据.*?:?\s*\*\*?(.*?)\*\*?(\n|$)/i);

  if (!currentPhaseMatch && !mainQuestMatch) return null;

  return {
    currentPhase: currentPhaseMatch ? currentPhaseMatch[1].trim() : '经济自主重建期',
    mainQuest: mainQuestMatch ? mainQuestMatch[1].trim() : '建立稳定现金流',
    keyRecentShift: shiftMatch ? shiftMatch[1].trim() : '',
    recentProgress: progressMatch ? progressMatch[1].trim() : '',
  };
}

function parseTodosMarkdown(text: string): TodoItem[] {
  const todos: TodoItem[] = [];
  const lines = text.split('\n');

  lines.forEach((line) => {
    const checkMatch = line.match(/^-\s*\[([ xX])\]\s*\*\*?(.*?)\*\*?(?:\s*\((.*?)\))?$/);
    if (checkMatch) {
      const completed = checkMatch[1].toLowerCase() === 'x';
      const title = checkMatch[2].trim();
      const metaStr = checkMatch[3] || '';

      let area: any = 'career';
      let estimatedMinutes = 30;
      let priority: any = 'medium';
      let date = new Date().toISOString().split('T')[0];
      let id = `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      let convertedToEventId: string | undefined = undefined;

      const areaMatch = metaStr.match(/领域:\s*`?([a-zA-Z_]+)`?/);
      if (areaMatch) area = areaMatch[1];

      const estMatch = metaStr.match(/预估:\s*`?(\d+)/);
      if (estMatch) estimatedMinutes = parseInt(estMatch[1], 10);

      const prioMatch = metaStr.match(/优先级:\s*`?(high|medium|low)`?/i);
      if (prioMatch) priority = prioMatch[1].toLowerCase();

      const dateMatch = metaStr.match(/日期:\s*`?([\d-]+)`?/);
      if (dateMatch) date = dateMatch[1];

      const idMatch = metaStr.match(/ID:\s*`?([a-zA-Z0-9_-]+)`?/);
      if (idMatch) id = idMatch[1];

      const bridgeMatch = metaStr.match(/已衔接事件:\s*`?([a-zA-Z0-9_-]+)`?/);
      if (bridgeMatch) convertedToEventId = bridgeMatch[1];

      todos.push({
        id,
        title,
        completed,
        area,
        estimatedMinutes,
        priority,
        date,
        convertedToEventId,
        createdAt: new Date().toISOString(),
      });
    }
  });

  return todos;
}

function parseDailyReviewMarkdown(text: string): DailyReview | null {
  const dateMatch = text.match(/date:\s*([\d-]+)/i) || text.match(/#\s*🌙?\s*([\d-]+)/);
  if (!dateMatch) return null;
  const date = dateMatch[1].trim();

  const getSectionLines = (headingRegex: RegExp): string[] => {
    const match = text.search(headingRegex);
    if (match === -1) return [];
    const sub = text.slice(match);
    const endMatch = sub.slice(1).search(/\n##\s+|\n---\s*$/);
    const sectionText = endMatch !== -1 ? sub.slice(0, endMatch + 1) : sub;
    return sectionText
      .split('\n')
      .filter((l) => l.trim().startsWith('-'))
      .map((l) => l.replace(/^-\s*(✅|🙏|💡|🧐|🔗)?\s*/, '').trim())
      .filter(Boolean);
  };

  const eventsSummary = getSectionLines(/##\s*1\.\s*📅?\s*今日发生/i);
  const successes = getSectionLines(/##\s*2\.\s*🌟?\s*今日成功/i);
  const gratitudes = getSectionLines(/##\s*3\.\s*🌸?\s*今日感恩/i);
  const integrations = getSectionLines(/##\s*4\.\s*🧩?\s*今日整合/i);
  const blindSpots = getSectionLines(/##\s*5\.\s*🔍?\s*今日盲区/i);
  const goalConnections = getSectionLines(/##\s*6\.\s*🎯?\s*目标与愿景/i);

  // Manifestation Narrative
  let manifestationNarrative = '';
  const maniMatch = text.match(/##\s*7\.\s*✨?\s*显化叙事[^\n]*\n([\s\S]*?)(?:\n---|\n##|$)/i);
  if (maniMatch) {
    manifestationNarrative = maniMatch[1].trim();
  }

  // Score
  let score = 8;
  const scoreMatch = text.match(/alignmentScore:\s*(\d+)/i) || text.match(/契合度\*\*?:\s*(\d+)/);
  if (scoreMatch) score = parseInt(scoreMatch[1], 10);

  return {
    id: `rev-${date}`,
    date,
    eventsSummary,
    successes,
    gratitudes,
    integrations,
    blindSpots,
    goalConnections,
    manifestationNarrative,
    innerCompass: {
      bodyWilling: !text.includes('身体愿意做: ❌'),
      heartPeaceful: !text.includes('内心平静: ❌'),
      proactiveChoice: !text.includes('主动选择: ❌'),
      facingReality: !text.includes('直面现实: ❌'),
      moreComplete: !text.includes('感到更完整: ❌'),
      alignmentScore: score,
      reflectionNotes: '',
    },
    confirmedData: true,
    createdAt: new Date().toISOString(),
  };
}

function parseEventsMarkdown(text: string): LifeEvent[] {
  const events: LifeEvent[] = [];
  const lines = text.split('\n');

  lines.forEach((line) => {
    if (!line.startsWith('|') || line.includes('---') || line.includes('日期 | 时间')) return;
    const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cols.length >= 4) {
      const date = cols[0];
      const timeStr = cols[1];
      const area: any = cols[2] || 'life';
      const desc = cols[3];
      const category = cols[4] || '生活';
      const duration = cols[5] || '30m';
      const raw = cols[6] || desc;

      if (date && date.match(/\d{4}-\d{2}-\d{2}/)) {
        events.push({
          id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date,
          time_start: timeStr !== '-' ? timeStr.split('-')[0] : undefined,
          time_end: timeStr !== '-' && timeStr.includes('-') ? timeStr.split('-')[1] : undefined,
          area,
          description: desc,
          category,
          duration_display: duration,
          duration_minutes: duration.includes('h') ? parseFloat(duration) * 60 : parseInt(duration, 10) || 30,
          raw_note: raw,
          confidence: 1,
          status: 'confirmed',
        });
      }
    }
  });

  return events;
}

function parseKnowledgeMarkdown(text: string): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];
  const sections = text.split(/\n##\s+\d+\.\s+/);

  sections.slice(1).forEach((sec) => {
    const firstLine = sec.split('\n')[0];
    const categoryMatch = firstLine.match(/\[([a-zA-Z_]+)\]/);
    const category: any = categoryMatch ? categoryMatch[1] : 'reflection';
    const title = firstLine.replace(/\[[a-zA-Z_]+\]/, '').trim();

    const contentMatch = sec.match(/###\s*核心内容\s*\n([\s\S]*?)(?:\n---|\n##|$)/);
    const content = contentMatch ? contentMatch[1].trim() : sec.slice(firstLine.length).trim();

    if (title && content) {
      items.push({
        id: `know-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        content,
        category,
        source: 'user_note',
        tags: ['导入知识'],
        createdAt: new Date().toISOString().split('T')[0],
      });
    }
  });

  return items;
}

function parseGoalsMarkdown(text: string): Goal[] {
  const goals: Goal[] = [];
  const sections = text.split(/\n##\s+\d+\.\s+/);

  sections.slice(1).forEach((sec) => {
    const titleLine = sec.split('\n')[0];
    const title = titleLine.replace(/\([^\)]+\)/, '').replace(/\[[^\]]+\]/, '').trim();
    const realityMatch = sec.match(/现实要做什么.*?:?\s*(.*?)(\n|$)/i);
    const whyMatch = sec.match(/为什么想要.*?:?\s*(.*?)(\n|$)/i);
    const identityMatch = sec.match(/我正在成为谁.*?:?\s*(.*?)(\n|$)/i);
    const coreBeliefMatch = sec.match(/核心信念.*?:?\s*(.*?)(\n|$)/i);

    const evidenceLines = sec
      .split('\n')
      .filter((l) => l.trim().startsWith('- ✅'))
      .map((l) => l.replace(/^-\s*✅\s*/, '').trim());

    if (title) {
      goals.push({
        id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        type: sec.includes('短期') ? 'short_term' : 'long_term',
        reality: realityMatch ? realityMatch[1] : '',
        why: whyMatch ? whyMatch[1] : '',
        identity: identityMatch ? identityMatch[1] : '',
        coreBelief: coreBeliefMatch ? coreBeliefMatch[1] : '',
        evidence: evidenceLines,
        visionConnection: '',
        manifestationNarrative: '',
        progressPercent: 50,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
      });
    }
  });

  return goals;
}

function parsePrinciplesMarkdown(text: string): Principle[] {
  const principles: Principle[] = [];
  const sections = text.split(/\n##\s+\d+\.\s+/);

  sections.slice(1).forEach((sec) => {
    const statement = sec.split('\n')[0].trim();
    const whyMatch = sec.match(/底层原因.*?:?\s*(.*?)(\n|$)/i);
    const catMatch = sec.match(/分类:\s*`?(.*?)`?(\n|$)/i);

    if (statement) {
      principles.push({
        id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        statement,
        category: catMatch ? catMatch[1] : '核心信念',
        why: whyMatch ? whyMatch[1] : '',
        createdAt: new Date().toISOString().split('T')[0],
      });
    }
  });

  return principles;
}

function parseVisionsMarkdown(text: string): Vision[] {
  const visions: Vision[] = [];
  const sections = text.split(/\n##\s+\d+\.\s+/);

  sections.slice(1).forEach((sec) => {
    const firstLine = sec.split('\n')[0];
    const catMatch = firstLine.match(/\[(.*?)\]/);
    const title = firstLine.replace(/\[.*?\]/, '').trim();
    const stmtMatch = sec.match(/愿景叙事:\s*(.*?)(\n|$)/i);

    if (title) {
      visions.push({
        id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        statement: stmtMatch ? stmtMatch[1] : '',
        category: catMatch ? catMatch[1] : 'career',
        createdAt: new Date().toISOString().split('T')[0],
      });
    }
  });

  return visions;
}

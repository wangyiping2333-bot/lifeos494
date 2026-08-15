import {
  DailyReview,
  Goal,
  KnowledgeItem,
  LifeEvent,
  LifeState,
  Principle,
  TodayFocusItem,
  TodoItem,
  TrajectoryPattern,
  UserPhaseMeta,
  Vision,
} from '../types';
import {
  INITIAL_DAILY_REVIEWS,
  INITIAL_EVENTS,
  INITIAL_FOCUS_ITEMS,
  INITIAL_GOALS,
  INITIAL_KNOWLEDGE_ITEMS,
  INITIAL_PATTERNS,
  INITIAL_PRINCIPLES,
  INITIAL_STATES,
  INITIAL_TODOS,
  INITIAL_USER_PHASE,
  INITIAL_VISIONS,
} from './mockData';

const KEYS = {
  PHASE: 'lifeos_phase',
  VISIONS: 'lifeos_visions',
  PRINCIPLES: 'lifeos_principles',
  GOALS: 'lifeos_goals',
  EVENTS: 'lifeos_events',
  STATES: 'lifeos_states',
  REVIEWS: 'lifeos_reviews',
  PATTERNS: 'lifeos_patterns',
  KNOWLEDGE: 'lifeos_knowledge',
  TODOS: 'lifeos_todos',
  FOCUS_ITEMS: 'lifeos_focus_items',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'undefined' || raw === 'null') return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to write to localStorage for key ${key}`, e);
  }
}

export const Storage = {
  getPhase(): UserPhaseMeta {
    const data = safeGet<UserPhaseMeta>(KEYS.PHASE, INITIAL_USER_PHASE);
    if (!data || typeof data !== 'object' || !data.currentPhase) {
      return INITIAL_USER_PHASE;
    }
    return {
      ...INITIAL_USER_PHASE,
      ...data,
    };
  },
  savePhase(phase: UserPhaseMeta) {
    safeSet(KEYS.PHASE, phase);
  },

  getVisions(): Vision[] {
    const list = safeGet(KEYS.VISIONS, INITIAL_VISIONS);
    return Array.isArray(list) ? list : INITIAL_VISIONS;
  },
  saveVisions(visions: Vision[]) {
    safeSet(KEYS.VISIONS, visions);
  },
  updateVision(id: string, updates: Partial<Vision>) {
    const list = this.getVisions();
    const idx = list.findIndex((v) => v.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.saveVisions(list);
    }
  },
  deleteVision(id: string) {
    const list = this.getVisions().filter((v) => v.id !== id);
    this.saveVisions(list);
  },

  getPrinciples(): Principle[] {
    const list = safeGet(KEYS.PRINCIPLES, INITIAL_PRINCIPLES);
    return Array.isArray(list) ? list : INITIAL_PRINCIPLES;
  },
  savePrinciples(principles: Principle[]) {
    safeSet(KEYS.PRINCIPLES, principles);
  },
  updatePrinciple(id: string, updates: Partial<Principle>) {
    const list = this.getPrinciples();
    const idx = list.findIndex((p) => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.savePrinciples(list);
    }
  },
  deletePrinciple(id: string) {
    const list = this.getPrinciples().filter((p) => p.id !== id);
    this.savePrinciples(list);
  },

  getGoals(): Goal[] {
    const list = safeGet(KEYS.GOALS, INITIAL_GOALS);
    return Array.isArray(list) ? list : INITIAL_GOALS;
  },
  saveGoals(goals: Goal[]) {
    safeSet(KEYS.GOALS, goals);
  },
  deleteGoal(id: string) {
    const goals = this.getGoals().filter((g) => g.id !== id);
    this.saveGoals(goals);
  },
  addGoalEvidence(goalId: string, evidenceText: string) {
    const goals = this.getGoals();
    const target = goals.find((g) => g.id === goalId);
    if (target) {
      if (!Array.isArray(target.evidence)) target.evidence = [];
      target.evidence.unshift(evidenceText);
      target.progressPercent = Math.min(100, (target.progressPercent || 50) + 5);
      this.saveGoals(goals);
    }
  },

  getEvents(): LifeEvent[] {
    const list = safeGet(KEYS.EVENTS, INITIAL_EVENTS);
    return Array.isArray(list) ? list : INITIAL_EVENTS;
  },
  saveEvents(events: LifeEvent[]) {
    safeSet(KEYS.EVENTS, events);
  },
  addEvent(event: Omit<LifeEvent, 'id'>): LifeEvent {
    const events = this.getEvents();
    const newEvent: LifeEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    events.unshift(newEvent);
    this.saveEvents(events);
    return newEvent;
  },
  updateEvent(id: string, updates: Partial<LifeEvent>) {
    const events = this.getEvents();
    const index = events.findIndex((e) => e.id === id);
    if (index !== -1) {
      events[index] = { ...events[index], ...updates };
      this.saveEvents(events);
    }
  },
  deleteEvent(id: string) {
    const events = this.getEvents().filter((e) => e.id !== id);
    this.saveEvents(events);
  },

  getStates(): LifeState[] {
    const list = safeGet(KEYS.STATES, INITIAL_STATES);
    return Array.isArray(list) ? list : INITIAL_STATES;
  },
  saveStates(states: LifeState[]) {
    safeSet(KEYS.STATES, states);
  },
  addState(state: Omit<LifeState, 'id'>): LifeState {
    const states = this.getStates();
    const newState: LifeState = {
      ...state,
      id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    states.unshift(newState);
    this.saveStates(states);
    return newState;
  },

  getReviews(): DailyReview[] {
    const list = safeGet(KEYS.REVIEWS, INITIAL_DAILY_REVIEWS);
    return Array.isArray(list) ? list : INITIAL_DAILY_REVIEWS;
  },
  saveReviews(reviews: DailyReview[]) {
    safeSet(KEYS.REVIEWS, reviews);
  },
  saveDailyReview(review: DailyReview) {
    const reviews = this.getReviews();
    const index = reviews.findIndex((r) => r.date === review.date);
    if (index !== -1) {
      reviews[index] = review;
    } else {
      reviews.unshift(review);
    }
    this.saveReviews(reviews);
  },
  getReviewByDate(date: string): DailyReview | undefined {
    const reviews = this.getReviews();
    return reviews.find((r) => r.date === date);
  },

  getPatterns(): TrajectoryPattern[] {
    const list = safeGet(KEYS.PATTERNS, INITIAL_PATTERNS);
    return Array.isArray(list) ? list : INITIAL_PATTERNS;
  },
  savePatterns(patterns: TrajectoryPattern[]) {
    safeSet(KEYS.PATTERNS, patterns);
  },

  // --- Knowledge & Insights Vault (外脑知识库) ---
  getKnowledgeItems(): KnowledgeItem[] {
    const list = safeGet(KEYS.KNOWLEDGE, INITIAL_KNOWLEDGE_ITEMS);
    return Array.isArray(list) ? list : INITIAL_KNOWLEDGE_ITEMS;
  },
  saveKnowledgeItems(items: KnowledgeItem[]) {
    safeSet(KEYS.KNOWLEDGE, items);
  },
  addKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'createdAt'>): KnowledgeItem {
    const items = this.getKnowledgeItems();
    const newItem: KnowledgeItem = {
      ...item,
      id: `know-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    items.unshift(newItem);
    this.saveKnowledgeItems(items);
    return newItem;
  },
  updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>) {
    const items = this.getKnowledgeItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
      this.saveKnowledgeItems(items);
    }
  },
  deleteKnowledgeItem(id: string) {
    const items = this.getKnowledgeItems().filter((i) => i.id !== id);
    this.saveKnowledgeItems(items);
  },

  // --- Short-term Todos (短期待办) ---
  getTodos(): TodoItem[] {
    const list = safeGet(KEYS.TODOS, INITIAL_TODOS);
    return Array.isArray(list) ? list : INITIAL_TODOS;
  },
  saveTodos(todos: TodoItem[]) {
    safeSet(KEYS.TODOS, todos);
  },
  addTodo(todo: Omit<TodoItem, 'id' | 'createdAt'>): TodoItem {
    const todos = this.getTodos();
    const newTodo: TodoItem = {
      ...todo,
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    todos.unshift(newTodo);
    this.saveTodos(todos);
    return newTodo;
  },
  updateTodo(id: string, updates: Partial<TodoItem>) {
    const todos = this.getTodos();
    const idx = todos.findIndex((t) => t.id === id);
    if (idx !== -1) {
      todos[idx] = { ...todos[idx], ...updates };
      this.saveTodos(todos);
    }
  },
  toggleTodo(id: string): { todo: TodoItem; completed: boolean } | null {
    const todos = this.getTodos();
    const target = todos.find((t) => t.id === id);
    if (!target) return null;
    const newCompleted = !target.completed;
    target.completed = newCompleted;
    target.completedAt = newCompleted ? new Date().toISOString() : undefined;
    this.saveTodos(todos);
    return { todo: target, completed: newCompleted };
  },
  deleteTodo(id: string) {
    const todos = this.getTodos().filter((t) => t.id !== id);
    this.saveTodos(todos);
  },
  bridgeTodoToEvent(todoId: string): LifeEvent | undefined {
    const todos = this.getTodos();
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return undefined;

    // Check if already bridged
    if (todo.convertedToEventId) {
      const existingEvents = this.getEvents();
      const found = existingEvents.find((e) => e.id === todo.convertedToEventId);
      if (found) return found;
    }

    const durationMin = todo.estimatedMinutes || 30;
    const durationDisplay = durationMin >= 60 ? `${(durationMin / 60).toFixed(1)}h` : `${durationMin}m`;

    const newEvent = this.addEvent({
      date: todo.date || new Date().toISOString().split('T')[0],
      description: todo.title,
      area: todo.area,
      category: todo.area === 'career' ? '日常工作' : todo.area === 'health' ? '身体恢复' : '生活',
      duration_minutes: durationMin,
      duration_display: durationDisplay,
      raw_note: `[待办完成转化] ${todo.title}`,
      confidence: 0.98,
      status: 'confirmed',
    });

    todo.convertedToEventId = newEvent.id;
    if (!todo.completed) {
      todo.completed = true;
      todo.completedAt = new Date().toISOString();
    }
    this.saveTodos(todos);
    return newEvent;
  },

  // Today's Key Focus Sticky Note (Max 3 Items)
  getFocusItems(): TodayFocusItem[] {
    const list = safeGet<TodayFocusItem[]>(KEYS.FOCUS_ITEMS, INITIAL_FOCUS_ITEMS);
    if (!Array.isArray(list)) return INITIAL_FOCUS_ITEMS.slice(0, 3);
    return list.slice(0, 3);
  },

  saveFocusItems(items: TodayFocusItem[]) {
    safeSet(KEYS.FOCUS_ITEMS, items.slice(0, 3));
  },

  addFocusItem(text: string): TodayFocusItem | null {
    const current = this.getFocusItems();
    if (current.length >= 3 || !text.trim()) {
      return null;
    }
    const newItem: TodayFocusItem = {
      id: `focus-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: text.trim(),
      completed: false,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    const next = [...current, newItem].slice(0, 3);
    this.saveFocusItems(next);
    return newItem;
  },

  toggleFocusItem(id: string) {
    const list = this.getFocusItems();
    const target = list.find((item) => item.id === id);
    if (target) {
      target.completed = !target.completed;
      this.saveFocusItems(list);
    }
  },

  updateFocusItem(id: string, text: string) {
    const list = this.getFocusItems();
    const target = list.find((item) => item.id === id);
    if (target && text.trim()) {
      target.text = text.trim();
      this.saveFocusItems(list);
    }
  },

  deleteFocusItem(id: string) {
    const list = this.getFocusItems().filter((item) => item.id !== id);
    this.saveFocusItems(list);
  },

  resetAllToDefault() {
    safeSet(KEYS.PHASE, INITIAL_USER_PHASE);
    safeSet(KEYS.VISIONS, INITIAL_VISIONS);
    safeSet(KEYS.PRINCIPLES, INITIAL_PRINCIPLES);
    safeSet(KEYS.GOALS, INITIAL_GOALS);
    safeSet(KEYS.EVENTS, INITIAL_EVENTS);
    safeSet(KEYS.STATES, INITIAL_STATES);
    safeSet(KEYS.REVIEWS, INITIAL_DAILY_REVIEWS);
    safeSet(KEYS.PATTERNS, INITIAL_PATTERNS);
    safeSet(KEYS.KNOWLEDGE, INITIAL_KNOWLEDGE_ITEMS);
    safeSet(KEYS.TODOS, INITIAL_TODOS);
    safeSet(KEYS.FOCUS_ITEMS, INITIAL_FOCUS_ITEMS);
  },

  exportBackupJson(): string {
    const data = {
      phase: this.getPhase(),
      visions: this.getVisions(),
      principles: this.getPrinciples(),
      goals: this.getGoals(),
      events: this.getEvents(),
      states: this.getStates(),
      reviews: this.getReviews(),
      patterns: this.getPatterns(),
      knowledge: this.getKnowledgeItems(),
      todos: this.getTodos(),
      focusItems: this.getFocusItems(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  importBackupJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.phase) this.savePhase(data.phase);
      if (data.visions) this.saveVisions(data.visions);
      if (data.principles) this.savePrinciples(data.principles);
      if (data.goals) this.saveGoals(data.goals);
      if (data.events) this.saveEvents(data.events);
      if (data.states) this.saveStates(data.states);
      if (data.reviews) this.saveReviews(data.reviews);
      if (data.patterns) this.savePatterns(data.patterns);
      if (data.knowledge) this.saveKnowledgeItems(data.knowledge);
      if (data.todos) this.saveTodos(data.todos);
      if (data.focusItems) this.saveFocusItems(data.focusItems);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },
};

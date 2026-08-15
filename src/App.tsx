import React, { useState, useEffect } from 'react';
import { Target, LineChart, Layers } from 'lucide-react';
import { Header, AppTabType } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DayModeView } from './components/DayModeView';
import { DailyReviewView } from './components/DailyReviewView';
import { VisionGoalsView } from './components/VisionGoalsView';
import { TrajectoryView } from './components/TrajectoryView';
import { TimelineView } from './components/TimelineView';
import { GrowthMentorView } from './components/GrowthMentorView';
import { InnerCompassModal } from './components/InnerCompassModal';
import { DataManagementModal } from './components/DataManagementModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Storage } from './lib/storage';
import { GeminiKeyManager } from './lib/geminiKey';
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
} from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTabType>('day');

  // Application State
  const [userPhase, setUserPhase] = useState<UserPhaseMeta>(Storage.getPhase());
  const [visions, setVisions] = useState<Vision[]>(Storage.getVisions());
  const [principles, setPrinciples] = useState<Principle[]>(Storage.getPrinciples());
  const [goals, setGoals] = useState<Goal[]>(Storage.getGoals());
  const [events, setEvents] = useState<LifeEvent[]>(Storage.getEvents());
  const [states, setStates] = useState<LifeState[]>(Storage.getStates());
  const [reviews, setReviews] = useState<DailyReview[]>(Storage.getReviews());
  const [patterns, setPatterns] = useState<TrajectoryPattern[]>(Storage.getPatterns());
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>(Storage.getKnowledgeItems());
  const [todos, setTodos] = useState<TodoItem[]>(Storage.getTodos());
  const [focusItems, setFocusItems] = useState<TodayFocusItem[]>(Storage.getFocusItems());

  // Modal States
  const [showCompassModal, setShowCompassModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasCustomApiKey, setHasCustomApiKey] = useState(GeminiKeyManager.hasCustomKey());

  const handleKeyUpdated = () => {
    setHasCustomApiKey(GeminiKeyManager.hasCustomKey());
  };

  // Reload all states
  const reloadAllData = () => {
    setUserPhase(Storage.getPhase());
    setVisions(Storage.getVisions());
    setPrinciples(Storage.getPrinciples());
    setGoals(Storage.getGoals());
    setEvents(Storage.getEvents());
    setStates(Storage.getStates());
    setReviews(Storage.getReviews());
    setPatterns(Storage.getPatterns());
    setKnowledgeItems(Storage.getKnowledgeItems());
    setTodos(Storage.getTodos());
    setFocusItems(Storage.getFocusItems());
  };

  // Focus Items Handlers (Sticky Note: Max 3 items)
  const handleAddFocusItem = (text: string) => {
    Storage.addFocusItem(text);
    setFocusItems(Storage.getFocusItems());
  };

  const handleToggleFocusItem = (id: string) => {
    Storage.toggleFocusItem(id);
    setFocusItems(Storage.getFocusItems());
  };

  const handleDeleteFocusItem = (id: string) => {
    Storage.deleteFocusItem(id);
    setFocusItems(Storage.getFocusItems());
  };

  const handleUpdateFocusItem = (id: string, text: string) => {
    Storage.updateFocusItem(id, text);
    setFocusItems(Storage.getFocusItems());
  };

  // Todo Handlers
  const handleAddTodo = (todo: Omit<TodoItem, 'id' | 'createdAt'>) => {
    Storage.addTodo(todo);
    setTodos(Storage.getTodos());
  };

  const handleToggleTodo = (id: string) => {
    Storage.toggleTodo(id);
    setTodos(Storage.getTodos());
  };

  const handleUpdateTodo = (id: string, updates: Partial<TodoItem>) => {
    Storage.updateTodo(id, updates);
    setTodos(Storage.getTodos());
  };

  const handleDeleteTodo = (id: string) => {
    Storage.deleteTodo(id);
    setTodos(Storage.getTodos());
  };

  const handleBridgeTodoToEvent = (todoId: string) => {
    Storage.bridgeTodoToEvent(todoId);
    setTodos(Storage.getTodos());
    setEvents(Storage.getEvents());
  };

  // Event Handlers
  const handleAddEvent = (evt: Omit<LifeEvent, 'id'>) => {
    Storage.addEvent(evt);
    setEvents(Storage.getEvents());
  };

  const handleUpdateEvent = (id: string, updates: Partial<LifeEvent>) => {
    Storage.updateEvent(id, updates);
    setEvents(Storage.getEvents());
  };

  const handleDeleteEvent = (id: string) => {
    Storage.deleteEvent(id);
    setEvents(Storage.getEvents());
  };

  const handleAddState = (st: Omit<LifeState, 'id'>) => {
    Storage.addState(st);
    setStates(Storage.getStates());
  };

  // Knowledge Handlers
  const handleAddKnowledge = (k: Omit<KnowledgeItem, 'id' | 'createdAt'>) => {
    Storage.addKnowledgeItem(k);
    setKnowledgeItems(Storage.getKnowledgeItems());
  };

  const handleUpdateKnowledge = (id: string, updates: Partial<KnowledgeItem>) => {
    Storage.updateKnowledgeItem(id, updates);
    setKnowledgeItems(Storage.getKnowledgeItems());
  };

  const handleDeleteKnowledge = (id: string) => {
    Storage.deleteKnowledgeItem(id);
    setKnowledgeItems(Storage.getKnowledgeItems());
  };

  const handleSaveReview = (review: DailyReview) => {
    Storage.saveDailyReview(review);
    setReviews(Storage.getReviews());
  };

  const handleAddGoal = (goal: Goal) => {
    const nextGoals = [goal, ...goals];
    Storage.saveGoals(nextGoals);
    setGoals(nextGoals);
  };

  const handleUpdateGoal = (id: string, updates: Partial<Goal>) => {
    const nextGoals = goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
    Storage.saveGoals(nextGoals);
    setGoals(nextGoals);
  };

  const handleDeleteGoal = (id: string) => {
    Storage.deleteGoal(id);
    setGoals(Storage.getGoals());
  };

  const handleAddEvidence = (goalId: string, text: string) => {
    Storage.addGoalEvidence(goalId, text);
    setGoals(Storage.getGoals());
  };

  const handleAddPrinciple = (principle: Principle) => {
    const next = [principle, ...principles];
    Storage.savePrinciples(next);
    setPrinciples(next);
  };

  const handleUpdatePrinciple = (id: string, updates: Partial<Principle>) => {
    Storage.updatePrinciple(id, updates);
    setPrinciples(Storage.getPrinciples());
  };

  const handleDeletePrinciple = (id: string) => {
    Storage.deletePrinciple(id);
    setPrinciples(Storage.getPrinciples());
  };

  const handleAddVision = (vision: Vision) => {
    const next = [vision, ...visions];
    Storage.saveVisions(next);
    setVisions(next);
  };

  const handleUpdateVision = (id: string, updates: Partial<Vision>) => {
    Storage.updateVision(id, updates);
    setVisions(Storage.getVisions());
  };

  const handleDeleteVision = (id: string) => {
    Storage.deleteVision(id);
    setVisions(Storage.getVisions());
  };

  const handleUpdatePatterns = (nextPatterns: TrajectoryPattern[]) => {
    Storage.savePatterns(nextPatterns);
    setPatterns(nextPatterns);
  };

  // Check today unconfirmed items
  const todayStr = new Date().toISOString().split('T')[0];
  const todayUnconfirmed = events.filter(
    (e) => e.date === todayStr && (!e.duration_display || e.duration_display === '未知')
  ).length;

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#2E2A24] font-sans antialiased flex flex-col selection:bg-amber-200 selection:text-amber-900">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userPhase={userPhase}
        todayPendingReviewsCount={todayUnconfirmed}
        onOpenDataModal={() => setShowDataModal(true)}
        onOpenCompassModal={() => setShowCompassModal(true)}
        onOpenApiKeyModal={() => setShowApiKeyModal(true)}
        hasCustomApiKey={hasCustomApiKey}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-24 md:pb-16">
        {currentTab === 'day' && (
          <DayModeView
            events={events}
            states={states}
            focusItems={focusItems}
            goals={goals}
            principles={principles}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onAddState={handleAddState}
            onAddFocusItem={handleAddFocusItem}
            onToggleFocusItem={handleToggleFocusItem}
            onDeleteFocusItem={handleDeleteFocusItem}
            onUpdateFocusItem={handleUpdateFocusItem}
            onGoToReview={() => setCurrentTab('review')}
          />
        )}

        {currentTab === 'mentor' && (
          <GrowthMentorView
            userPhase={userPhase}
            knowledgeItems={knowledgeItems}
            goals={goals}
            principles={principles}
            recentEvents={events}
            recentStates={states}
            recentReviews={reviews}
            onAddKnowledgeItem={handleAddKnowledge}
            onUpdateKnowledgeItem={handleUpdateKnowledge}
            onDeleteKnowledgeItem={handleDeleteKnowledge}
            onAddKnowledge={handleAddKnowledge}
            onDeleteKnowledge={handleDeleteKnowledge}
            onAddPrinciple={handleAddPrinciple}
            onUpdatePrinciple={handleUpdatePrinciple}
            onDeletePrinciple={handleDeletePrinciple}
          />
        )}

        {currentTab === 'review' && (
          <DailyReviewView
            events={events}
            states={states}
            goals={goals}
            principles={principles}
            dailyReviews={reviews}
            onSaveReview={handleSaveReview}
            onUpdateEvent={handleUpdateEvent}
          />
        )}

        {/* Mobile Sub-Navigation for Compass Module (< md screens) */}
        {(currentTab === 'vision_goals' || currentTab === 'trajectory' || currentTab === 'timeline') && (
          <div className="md:hidden max-w-7xl mx-auto px-3 pt-2.5 pb-0.5">
            <div className="flex items-center bg-[#EAE4D8] p-0.5 rounded-xl border border-[#DCD4C6] gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setCurrentTab('vision_goals')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                  currentTab === 'vision_goals'
                    ? 'bg-white text-[#2E2A24] font-semibold shadow-xs'
                    : 'text-[#736B5E] active:text-[#2E2A24]'
                }`}
              >
                <Target className="w-3 h-3 text-rose-600" />
                <span>愿景目标</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('trajectory')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                  currentTab === 'trajectory'
                    ? 'bg-white text-[#2E2A24] font-semibold shadow-xs'
                    : 'text-[#736B5E] active:text-[#2E2A24]'
                }`}
              >
                <LineChart className="w-3 h-3 text-emerald-600" />
                <span>长期轨迹</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('timeline')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                  currentTab === 'timeline'
                    ? 'bg-white text-[#2E2A24] font-semibold shadow-xs'
                    : 'text-[#736B5E] active:text-[#2E2A24]'
                }`}
              >
                <Layers className="w-3 h-3 text-stone-700" />
                <span>事件簿</span>
              </button>
            </div>
          </div>
        )}

        {currentTab === 'vision_goals' && (
          <VisionGoalsView
            visions={visions}
            principles={principles}
            goals={goals}
            events={events}
            reviews={reviews}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            onAddEvidence={handleAddEvidence}
            onAddPrinciple={handleAddPrinciple}
            onUpdatePrinciple={handleUpdatePrinciple}
            onDeletePrinciple={handleDeletePrinciple}
            onAddVision={handleAddVision}
            onUpdateVision={handleUpdateVision}
            onDeleteVision={handleDeleteVision}
            onOpenMentorPrinciples={() => setCurrentTab('mentor')}
          />
        )}

        {currentTab === 'trajectory' && (
          <TrajectoryView
            events={events}
            states={states}
            patterns={patterns}
            principles={principles}
            onUpdatePatterns={handleUpdatePatterns}
          />
        )}

        {currentTab === 'timeline' && (
          <TimelineView
            events={events}
            onAddEvent={handleAddEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        todayPendingReviewsCount={todayUnconfirmed}
      />

      {/* Subtle Philosophy Footer */}
      <footer className="border-t border-[#E8E2D6] bg-[#F2EDE4]/60 py-6 text-center text-xs text-[#827A6D]">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-serif italic text-[#575044]">
            “用户负责生活，AI 负责理解生活 · 不要为了 LifeOS 而生活”
          </p>
          <p className="text-[11px] text-[#A39B8E]">
            LifeOS · AI-Native Personal Operating System · 现实 ➔ 状态 ➔ 导师 ➔ 模式 ➔ 愿景与轨迹
          </p>
        </div>
      </footer>

      {/* Modals */}
      <InnerCompassModal
        isOpen={showCompassModal}
        onClose={() => setShowCompassModal(false)}
      />

      <DataManagementModal
        isOpen={showDataModal}
        onClose={() => setShowDataModal(false)}
        onDataReload={reloadAllData}
        onOpenApiKeyModal={() => setShowApiKeyModal(true)}
      />

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onKeyUpdated={handleKeyUpdated}
      />
    </div>
  );
}

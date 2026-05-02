import { motion } from 'motion/react';
import { ArrowLeft, MessageSquare, Play, History, Info, Activity, Clock, Shield, Heart, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

export type CharacterDetailData = {
  characterId: string;
  name: string;
  roleLabel: string;
  avatarUrl: string;
  coverMediaUrl?: string;
  isVideo?: boolean;
  relationshipStage: string;
  relationshipStatusLabel: string;
  relationshipSummary: string;
  metrics: {
    trust?: number;
    dependence?: number;
    intimacy?: number;
    sync?: number;
  };
  interactionSummary: {
    totalInteractions?: number;
    totalGames?: number;
    totalChapters?: number;
    firstMetGameTitle?: string;
    firstMetChapterTitle?: string;
    lastInteractionAt?: string;
    lastGameTitle?: string;
    lastChapterTitle?: string;
    lastInteractionSummary?: string;
    chatEntryLabel?: string;
  };
  timeline: Array<{
    id: string;
    occurredAt?: string;
    gameTitle: string;
    chapterTitle: string;
    eventTitle: string;
    eventSummary: string;
    impactSummary?: string;
  }>;
  relatedGames: Array<{
    gameId: string;
    title: string;
    chapterLabel?: string;
    progressState?: 'continue' | 'completed' | 'locked' | 'discover';
    shortReason?: string;
  }>;
  profile: {
    identity?: string;
    personalityTags?: string[];
    trustTriggers?: string[];
    riskTriggers?: string[];
  };
};

// Mock Data Builder based on the interaction passed from CharactersTab
export function getMockCharacterDetail(interaction: any): CharacterDetailData {
  return {
    characterId: interaction.id.toString(),
    name: interaction.character.name,
    roleLabel: interaction.character.role,
    avatarUrl: interaction.character.avatar,
    isVideo: interaction.character.isVideo,
    relationshipStage: interaction.relationship.label,
    relationshipStatusLabel: "Trust Fracturing", // Mocked
    relationshipSummary: "She is starting to reveal her vulnerabilities, but remains highly defensive when pressed.",
    metrics: {
      trust: 78,
      dependence: 62,
      intimacy: 45,
      sync: 80,
    },
    interactionSummary: {
      totalInteractions: 142,
      totalGames: 2,
      totalChapters: 5,
      firstMetGameTitle: "Origin Story",
      firstMetChapterTitle: "Ep. 1",
      lastInteractionAt: interaction.time,
      lastGameTitle: interaction.series.title,
      lastChapterTitle: interaction.series.episode,
      lastInteractionSummary: interaction.lastMessage,
      chatEntryLabel: "Chat with " + interaction.character.name,
    },
    timeline: [
      {
        id: "t1",
        occurredAt: "2 days ago",
        gameTitle: interaction.series.title,
        chapterTitle: "Ep. 1",
        eventTitle: "First Meeting",
        eventSummary: "You chose to save her instead of securing the data drive.",
        impactSummary: "Trust +20 / Relationship started",
      },
      {
        id: "t2",
        occurredAt: "Yesterday",
        gameTitle: interaction.series.title,
        chapterTitle: "Ep. 3",
        eventTitle: "The Argument",
        eventSummary: "You questioned her motives regarding the faction leader.",
        impactSummary: "Sync -10 / Trust slightly damaged",
      },
      {
        id: "t3",
        occurredAt: "Today",
        gameTitle: interaction.series.title,
        chapterTitle: interaction.series.episode,
        eventTitle: "Vulnerability",
        eventSummary: "She shared her real name and past trauma.",
        impactSummary: "Dependence +15 / Entered 'Trust Fracturing' phase",
      }
    ],
    relatedGames: [
      {
        gameId: "g1",
        title: interaction.series.title,
        chapterLabel: "Continue " + interaction.series.episode,
        progressState: "continue",
        shortReason: "Pick up where you left off",
      },
      {
        gameId: "g2",
        title: "Side Story: Echoes",
        chapterLabel: "Unlockable",
        progressState: "discover",
        shortReason: "High involvement from " + interaction.character.name,
      }
    ],
    profile: {
      identity: interaction.character.role,
      personalityTags: ["Defensive", "Loyal", "Analytical", "Slow to trust"],
      trustTriggers: ["Consistent choices", "Prioritizing her safety", "Active listening"],
      riskTriggers: ["Lying", "Choosing faction over her", "Ignoring her warnings"],
    }
  };
}

export function CharacterDetailPage({ 
  data, 
  onClose 
}: { 
  data: CharacterDetailData; 
  onClose: () => void 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute inset-0 z-[120] bg-[#020202] text-white overflow-y-auto hide-scrollbar flex flex-col"
    >
      {/* Top Bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-5 pt-14 pb-4 bg-gradient-to-b from-[#020202] via-[#020202]/80 to-transparent backdrop-blur-sm">
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <span className="text-[13px] font-bold tracking-widest uppercase opacity-80" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Character Profile
        </span>
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md">
          <span className="w-1 h-1 rounded-full bg-white mx-[1px]" />
          <span className="w-1 h-1 rounded-full bg-white mx-[1px]" />
          <span className="w-1 h-1 rounded-full bg-white mx-[1px]" />
        </button>
      </div>

      {/* Module A: Hero Area */}
      <div className="relative px-5 pt-2 pb-4 flex flex-col items-center text-center">
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl mb-4">
          {data.isVideo ? (
            <video src={data.avatarUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={data.avatarUrl} alt={data.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {data.name}
        </h1>
        <p className="text-[13px] text-white/60 uppercase tracking-widest font-medium mb-3">
          {data.roleLabel}
        </p>
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            {data.relationshipStage}
          </span>
        </div>

        <p className="text-[13px] text-white/70 max-w-[280px] leading-relaxed mb-2">
          "{data.interactionSummary.lastInteractionSummary}"
        </p>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />

      {/* Module B: Relationship Status */}
      <div className="px-5 pt-4 pb-6">
        <h2 className="text-[11px] text-white/50 uppercase tracking-widest font-bold mb-6 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" />
          Relationship Status
        </h2>
        
        <p className="text-[13px] text-white/80 leading-relaxed mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
          {data.relationshipSummary}
        </p>

        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider mb-2">
              <span className="text-white/60 flex items-center gap-1.5"><Shield className="w-3 h-3"/> Trust</span>
              <span className="text-white">{data.metrics.trust}%</span>
            </div>
            <Progress value={data.metrics.trust} className="h-1.5 bg-white/10" indicatorClassName="bg-blue-400" />
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider mb-2">
              <span className="text-white/60 flex items-center gap-1.5"><Heart className="w-3 h-3"/> Intimacy</span>
              <span className="text-white">{data.metrics.intimacy}%</span>
            </div>
            <Progress value={data.metrics.intimacy} className="h-1.5 bg-white/10" indicatorClassName="bg-rose-400" />
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider mb-2">
              <span className="text-white/60 flex items-center gap-1.5"><Zap className="w-3 h-3"/> Sync</span>
              <span className="text-white">{data.metrics.sync}%</span>
            </div>
            <Progress value={data.metrics.sync} className="h-1.5 bg-white/10" indicatorClassName="bg-amber-400" />
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider mb-2">
              <span className="text-white/60 flex items-center gap-1.5"><Clock className="w-3 h-3"/> Dependence</span>
              <span className="text-white">{data.metrics.dependence}%</span>
            </div>
            <Progress value={data.metrics.dependence} className="h-1.5 bg-white/10" indicatorClassName="bg-purple-400" />
          </div>
        </div>
      </div>

      {/* Module C: Quick Actions */}
      <div className="px-5 py-6 bg-white/[0.02] border-y border-white/5">
        <h2 className="text-[11px] text-white/50 uppercase tracking-widest font-bold mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-col gap-3">
          <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-left group">
            <div>
              <h3 className="text-[14px] font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">Continue Last Chapter</h3>
              <p className="text-[11px] text-white/50">Return to {data.interactionSummary.lastGameTitle} • {data.interactionSummary.lastChapterTitle}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-white fill-current" />
            </div>
          </button>
          
          <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-left group">
            <div>
              <h3 className="text-[14px] font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{data.interactionSummary.chatEntryLabel}</h3>
              <p className="text-[11px] text-white/50">Start a conversation with current relationship context</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
        </div>
      </div>

      {/* Module D: Interaction Snapshot */}
      <div className="px-5 py-6">
        <h2 className="text-[11px] text-white/50 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
          <History className="w-3.5 h-3.5" />
          Interaction Snapshot
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">First Met</p>
            <p className="text-[12px] font-medium text-white truncate">{data.interactionSummary.firstMetGameTitle}</p>
            <p className="text-[10px] text-white/60">{data.interactionSummary.firstMetChapterTitle}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Total Time</p>
            <p className="text-[12px] font-medium text-white">{data.interactionSummary.totalInteractions} Interactions</p>
            <p className="text-[10px] text-white/60">Across {data.interactionSummary.totalGames} Games</p>
          </div>
        </div>
      </div>

      {/* Module E: Timeline */}
      <div className="px-5 py-6">
        <h2 className="text-[11px] text-white/50 uppercase tracking-widest font-bold mb-6 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Key Events
        </h2>
        <div className="relative border-l border-white/10 ml-3 space-y-6">
          {data.timeline.map((event) => (
            <div key={event.id} className="relative pl-6">
              {/* Timeline Dot */}
              <div className="absolute -left-[5px] top-1 w-[9px] h-[9px] rounded-full bg-[#020202] border-2 border-emerald-500" />
              
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-[13px] font-bold text-white">{event.eventTitle}</h3>
                <span className="text-[10px] text-white/40 uppercase tracking-wider">{event.occurredAt}</span>
              </div>
              <p className="text-[11px] text-white/60 mb-2">
                {event.gameTitle} • {event.chapterTitle}
              </p>
              <p className="text-[12px] text-white/80 leading-snug mb-2">
                {event.eventSummary}
              </p>
              {event.impactSummary && (
                <div className="inline-block px-2 py-1 rounded md bg-white/5 border border-white/10 text-[10px] font-medium text-emerald-400">
                  {event.impactSummary}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Module F: Related Games */}
      <div className="px-5 py-6 bg-white/[0.02] border-y border-white/5">
        <h2 className="text-[11px] text-white/50 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
          <Play className="w-3.5 h-3.5" />
          Related Content
        </h2>
        <div className="flex flex-col gap-2">
          {data.relatedGames.map((game) => (
            <div key={game.gameId} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <h3 className="text-[13px] font-bold text-white mb-0.5">{game.title}</h3>
                <p className="text-[11px] text-white/50">{game.shortReason}</p>
              </div>
              <Badge variant="outline" className="bg-[#020202] border-white/20 text-white/70 text-[10px] uppercase tracking-wider">
                {game.progressState}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Module G: Profile */}
      <div className="px-5 py-6">
        <h2 className="text-[11px] text-white/50 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
          <Info className="w-3.5 h-3.5" />
          Character Profile
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Traits</h3>
            <div className="flex flex-wrap gap-1.5">
              {data.profile.personalityTags?.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-white/10 text-white/80 hover:bg-white/20 border-transparent font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <h3 className="text-[10px] text-emerald-400 uppercase tracking-wider mb-2 font-bold">Builds Trust When You...</h3>
            <ul className="space-y-1.5">
              {data.profile.trustTriggers?.map((trigger, i) => (
                <li key={i} className="text-[12px] text-emerald-200/80 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span> {trigger}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <h3 className="text-[10px] text-rose-400 uppercase tracking-wider mb-2 font-bold">Triggers Defense When You...</h3>
            <ul className="space-y-1.5">
              {data.profile.riskTriggers?.map((trigger, i) => (
                <li key={i} className="text-[12px] text-rose-200/80 flex items-start gap-2">
                  <span className="text-rose-500 mt-0.5">•</span> {trigger}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Module H: Bottom Actions */}
      <div className="sticky bottom-0 left-0 right-0 px-5 pt-4 pb-6 bg-[#020202]/60 backdrop-blur-xl border-t border-white/5 z-40 flex gap-3 mt-auto">
        <Button className="flex-1 bg-white text-black hover:bg-white/90 rounded-full h-11 text-[12px] font-bold tracking-widest uppercase shadow-lg transition-transform active:scale-95">
          <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
          Continue
        </Button>
        <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/20 bg-white/[0.03] rounded-full h-11 text-[12px] font-bold tracking-widest uppercase text-white transition-all active:scale-95">
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
          Chat
        </Button>
      </div>

    </motion.div>
  );
}

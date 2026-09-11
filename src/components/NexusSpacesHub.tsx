import React, { useState } from 'react';
import { Radio, Users, Sparkles, Compass, ShieldCheck } from 'lucide-react';
import { UserProfile, ThemeSettings, Chat } from '../types';
import { ChannelsAndStatusView } from './ChannelsAndStatusView';
import { CommunitiesView } from './CommunitiesView';

interface NexusSpacesHubProps {
  currentUser: UserProfile | null;
  themeSettings: ThemeSettings;
  chats: Chat[];
  onSendMessageToChat: (chatId: string, text: string) => void;
  onStartVoiceCall?: (channelName: string) => void;
  initialSubTab?: 'channels_status' | 'communities';
}

export const NexusSpacesHub: React.FC<NexusSpacesHubProps> = ({
  currentUser,
  themeSettings,
  chats,
  onSendMessageToChat,
  onStartVoiceCall,
  initialSubTab = 'channels_status',
}) => {
  const [subTab, setSubTab] = useState<'channels_status' | 'communities'>(initialSubTab);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Nexus Spaces Unified Top Switcher Bar */}
      <header className="px-4 py-3 bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-10 select-none">
        {/* Hub Title & Identity */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">Espacios Nexus</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Red Segura
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Canales de difusión pública, historias efímeras y servidores comunitarios de voz
              </p>
            </div>
          </div>
        </div>

        {/* Tactile Segmented Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/90 rounded-2xl border border-slate-800/90 shadow-inner w-full sm:w-auto justify-center">
          <button
            id="spaces-subtab-channels"
            type="button"
            onClick={() => setSubTab('channels_status')}
            className={`flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'channels_status'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 shrink-0" />
            <span>Canales & Estados 24h</span>
          </button>

          <button
            id="spaces-subtab-communities"
            type="button"
            onClick={() => setSubTab('communities')}
            className={`flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'communities'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Comunidades & Salas</span>
          </button>
        </div>
      </header>

      {/* Subview Content */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {subTab === 'channels_status' ? (
          <ChannelsAndStatusView
            currentUser={currentUser}
            chats={chats}
            themeSettings={themeSettings}
            onSendMessageToChat={onSendMessageToChat}
          />
        ) : (
          <CommunitiesView
            currentUser={currentUser}
            themeSettings={themeSettings}
            onStartVoiceCall={onStartVoiceCall}
          />
        )}
      </div>
    </div>
  );
};

import { StatusStory, BroadcastChannel, CommunityServer } from '../types';

export const INITIAL_STATUS_STORIES: StatusStory[] = [];

export const INITIAL_BROADCAST_CHANNELS: BroadcastChannel[] = [];

export const INITIAL_COMMUNITY_SERVERS: CommunityServer[] = [
  {
    id: 'srv_gaming_nexus',
    name: 'Nexus Gaming & Esports Zone',
    icon: '🎮',
    bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1000&auto=format&fit=crop',
    description: 'Servidor dedicado a videojuegos, streaming, squads competitivos y salas de voz en vivo.',
    ownerId: 'usr_community_lead',
    categories: [
      {
        id: 'cat_bienvenida',
        name: '📢 INFORMACIÓN',
        channels: [
          { id: 'chan_gam_rules', name: 'reglas-y-avisos', type: 'announcement', topic: 'Normas de convivencia del servidor' },
          { id: 'chan_gam_welcome', name: 'presentaciones', type: 'text', topic: 'Cuéntanos qué juegos te gustan' },
        ],
      },
      {
        id: 'cat_chat_gaming',
        name: '💬 SALAS DE TEXTO',
        channels: [
          { id: 'chan_gam_general', name: 'chat-general-gamer', type: 'text', topic: 'Conversaciones de gaming, memes y setups' },
          { id: 'chan_gam_clips', name: 'clips-y-capturas', type: 'text', topic: 'Comparte tus mejores momentos y jugadas' },
        ],
      },
      {
        id: 'cat_voice_gaming',
        name: '🔊 SALAS DE VOZ & SQUADS',
        channels: [
          { id: 'voice_gam_squad1', name: 'Squad Alfa (Voz)', type: 'voice', topic: 'Voz activa para partidas en equipo' },
          { id: 'voice_gam_chill', name: 'Charla Casual (Voz)', type: 'voice', topic: 'Conversaciones casuales de gaming' },
        ],
      },
    ],
    members: [],
  },
  {
    id: 'srv_tech_builders',
    name: 'Tech & Developers Global Hub',
    icon: '🚀',
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop',
    description: 'Comunidad de desarrolladores de software, arquitectura en la nube, diseño y proyectos open source.',
    ownerId: 'usr_community_lead',
    categories: [
      {
        id: 'cat_tech_main',
        name: '💻 DESARROLLO & CÓDIGO',
        channels: [
          { id: 'chan_tech_general', name: 'general-devs', type: 'text', topic: 'Arquitectura, frontend, backend y buenas prácticas' },
          { id: 'chan_tech_projects', name: 'proyectos-y-showcase', type: 'text', topic: 'Muestra lo que estás construyendo' },
          { id: 'chan_tech_help', name: 'ayuda-y-depuración', type: 'text', topic: 'Resolución colaborativa de dudas' },
        ],
      },
      {
        id: 'cat_tech_voice',
        name: '🔊 CO-WORKING & VOZ',
        channels: [
          { id: 'voice_tech_cowork', name: 'Sala de Co-Working Silencioso', type: 'voice', topic: 'Trabajar juntos en silencio' },
          { id: 'voice_tech_brainstorm', name: 'Lluvia de Ideas Tech', type: 'voice', topic: 'Charlas de diseño de sistemas' },
        ],
      },
    ],
    members: [],
  },
];

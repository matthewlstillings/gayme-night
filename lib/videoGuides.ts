/** Video game tips and guides shown under the board games on the hub. Each one is a standalone page. */
export type VideoGuide = {
  slug: string;
  name: string;
  /** Other names people search by. */
  aliases: string[];
  href: string;
  description: string;
  accent: string;
};

export const videoGuides: VideoGuide[] = [
  {
    slug: 'gta-6',
    name: 'GTA 6 Field Guide',
    aliases: ['Grand Theft Auto VI', 'GTA VI'],
    href: '/ngtmqrs928lqvt',
    description: 'Beginner tips and every missable.',
    accent: '#f061ba'
  }
];

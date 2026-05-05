export interface SocialLink {
  label: string;
  href: string;
  external?: boolean;
  me?: boolean;
}

export const socialLinks: SocialLink[] = [
  { label: 'github.com/josnun', href: 'https://github.com/josnun', external: true, me: true },
  { label: 'hi@josnun.com', href: 'mailto:hi@josnun.com' },
  { label: '@josiahnunemaker', href: 'https://x.com/josiahnunemaker', external: true, me: true },
  { label: '@josnun.bsky.social', href: 'https://bsky.app/profile/josnun.bsky.social', external: true, me: true },
];

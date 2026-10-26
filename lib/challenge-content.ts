export const challengeArtworkBySlug:Record<string,string>={
  'shadow-signal':'/images/challenges/shadow-signal.png',
  'micro-world-safari':'/images/challenges/micro-world-safari.png',
  'gravity-defier':'/images/challenges/gravity-defier.png',
};

export function challengeArtwork(slug:string,fallback?:string|null) {
  return challengeArtworkBySlug[slug]||fallback||null;
}

export type CampaignChallengeOverride={
  slug:string;
  title:string;
  shortDescription:string;
  description:string;
  instructions:string;
  safety:string;
  duration:string|null;
  imageUrl:string|null;
};

export const campaignChallenges=[
  {
    slug:'shadow-signal',
    title:'The Shadow Signal',
    shortDescription:'Can you make something ordinary look impossible?',
    description:'Turn an ordinary object into an extraordinary shadow.',
    instructions:[
      '1. Choose a safe, ordinary household object.',
      '2. Use daylight, a room light or an appropriately used flashlight to cast an interesting shadow on a plain surface.',
      '3. Look for a shape that resembles an animal, creature, place or mysterious object.',
      '4. Ask a family member, “What do you see?”',
      '5. Reveal the object that created the shadow.',
      'A photo or video can be used to create a guessing game, but neither is required to complete the challenge.',
      'For ages 6–8, try a recognizable animal or imaginary character. For ages 9–12, try a more abstract silhouette or a multi-object composition.',
      'Optional sharing prompt: “We found a hidden signal in an ordinary object. What do you see?”',
    ].join('\n'),
    safety:'Use no candles, hot bulbs, dangerous equipment, climbing or unsafe positioning. Do not require darkness or waiting until nighttime.',
    duration:null,
    imageUrl:challengeArtworkBySlug['shadow-signal'],
    displayOrder:1,
  },
  {
    slug:'micro-world-safari',
    title:'The Micro-World Safari',
    shortDescription:'What if you looked a little closer?',
    description:'Discover an extraordinary world hidden in something ordinary.',
    instructions:[
      '1. Choose a safe, clean, ordinary object or detail, such as fabric, a leaf, paper, a sponge or a water droplet.',
      '2. Inspect its patterns, texture, edges or tiny details.',
      '3. Take an optional close-up photo, draw what you noticed or describe it to someone.',
      '4. Ask someone to guess what the detail came from.',
      '5. Reveal the original object and name your discovery.',
      'A macro lens, special equipment and app installation are not required. A camera is optional.',
      'For ages 6–8, focus on simple textures and surprising shapes. For ages 9–12, look for patterns, compare details or create a more difficult mystery image.',
      'Optional sharing prompt: “Can you guess what this tiny world belongs to?”',
    ].join('\n'),
    safety:'Do not touch unknown insects, disturb wildlife, pick hazardous plants or collect unsafe objects.',
    duration:null,
    imageUrl:challengeArtworkBySlug['micro-world-safari'],
    displayOrder:2,
  },
  {
    slug:'gravity-defier',
    title:'The Gravity Defier',
    shortDescription:'Can you balance three objects in a way that looks impossible?',
    description:'Make ordinary objects do something unexpected.',
    instructions:[
      '1. Choose three safe, lightweight household objects.',
      '2. Try arranging them in a surprising but stable balance on a low, steady surface.',
      '3. Aim to keep the construction standing for three seconds.',
      '4. Let someone guess whether it will work before revealing the result.',
      'Use only suitable lightweight objects, such as cardboard, paper tubes, sponges and empty plastic containers.',
      'For ages 6–8, try simple two- or three-object arrangements. For ages 9–12, try more unusual configurations and creative problem-solving.',
      'Optional sharing prompt: “This should not balance… but does it?”',
    ].join('\n'),
    safety:'Do not use knives, glassware, heavy or breakable items, dangerous stacking heights or climbing. Experimentation should be fun; failure is an acceptable attempt and never a reason to shame or embarrass a child.',
    duration:null,
    imageUrl:challengeArtworkBySlug['gravity-defier'],
    displayOrder:3,
  },
] as const;

export function mergeCampaignChallenges(overrides:CampaignChallengeOverride[]) {
  const bySlug=new Map(overrides.map(challenge=>[challenge.slug,challenge]));
  return campaignChallenges.map(challenge=>{
    const override=bySlug.get(challenge.slug);
    return {
      ...challenge,
      ...override,
      imageUrl:challengeArtwork(challenge.slug,override?.imageUrl||challenge.imageUrl),
    };
  });
}

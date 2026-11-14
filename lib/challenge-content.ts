export const challengeArtworkBySlug:Record<string,string>={
  'shadow-signal':'/images/challenges/shadow-signal.png',
  'micro-world-safari':'/images/challenges/micro-world-safari.png',
  'gravity-defier':'/images/challenges/gravity-defier.png',
};

export function challengeArtwork(slug:string,fallback?:string|null) {
  return challengeArtworkBySlug[slug]||fallback||null;
}

export function challengeDisplayArtwork(slug:string,fallback?:string|null) {
  const image=challengeArtwork(slug,fallback);
  return image&&challengeArtworkBySlug[slug]?image.replace(/\.png$/i,'.webp'):image;
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
    title:'Shadow Signal',
    shortDescription:'Make a shadow signal with your hands, then listen to the night with a grown-up.',
    description:'Try The Great Signal mission from ROAMA Kids: shine a light on a wall with a grown-up, make a shadow signal with your hands, then turn off the light and listen to the night for one minute.',
    seoDescription:'ROAMA Kids · Shadow Signal: a free screen-free activity for ages 6–12. With a grown-up, make a hand shadow, turn off the light and listen to the night for one minute.',
    estimatedTime:'No set time; take it at your own pace.',
    materials:'A safe light, a wall and a grown-up.',
    ageGuidance:{
      ages6to8:'Make a simple hand shadow together with a grown-up.',
      ages9to12:'Try a more detailed hand signal together with a grown-up.',
    },
    whyInteresting:'Hands, light and a quiet minute help families notice shadows and the sounds of the night together.',
    optionalSharingPrompt:'We made our shadow signal and listened to the night with a grown-up.',
    imageAlt:'A child uses a small light to cast a playful creature-shaped shadow on a wall.',
    instructions:[
      '1. With a grown-up, shine a safe light on a wall.',
      '2. With a grown-up, make a shadow signal using your hands.',
      '3. With a grown-up, turn off the light and listen to the night for one minute.',
      'Stay in a safe, familiar place. Any outdoor or nighttime activity must be with a grown-up. No photo or video is needed.',
    ].join('\n'),
    safety:'Always do nighttime and outdoor steps with a grown-up. Stay in a safe, familiar place; keep paths clear. Use no candles, hot bulbs, dangerous equipment or climbing.',
    duration:null,
    imageUrl:challengeArtworkBySlug['shadow-signal'],
    displayOrder:1,
  },
  {
    slug:'micro-world-safari',
    title:'The Micro-World Safari',
    shortDescription:'What if you looked a little closer?',
    description:'Discover an extraordinary world hidden in something ordinary.',
    seoDescription:'A screen-free nature discovery activity for kids ages 6–12. Explore a clean leaf or everyday object up close, make a guess, and reveal its tiny world without special equipment.',
    estimatedTime:'No set time; take it at your own pace.',
    materials:'A safe, clean everyday object or detail. A camera or paper for drawing is optional.',
    ageGuidance:{
      ages6to8:'Focus on simple textures and surprising shapes.',
      ages9to12:'Look for patterns, compare details or create a more difficult mystery image.',
    },
    whyInteresting:'Looking closely can make an everyday leaf, fabric or sponge feel like a new landscape waiting to be explored.',
    optionalSharingPrompt:'Can you guess what this tiny world belongs to?',
    imageAlt:'A child looks through a magnifying glass at the detailed veins of a green leaf.',
    instructions:[
      '1. With a grown-up, choose a safe, clean, ordinary object or detail, such as fabric, a leaf, paper, a sponge or a water droplet.',
      '2. Inspect its patterns, texture, edges or tiny details.',
      '3. Take an optional close-up photo, draw what you noticed or describe it to someone.',
      '4. Ask someone to guess what the detail came from.',
      '5. Reveal the original object and name your discovery.',
      'A macro lens, special equipment and app installation are not required. A camera is optional.',
    ].join('\n'),
    safety:'Any outdoor activity must be with a grown-up. Do not touch unknown insects, disturb wildlife, pick hazardous plants or collect unsafe objects.',
    duration:null,
    imageUrl:challengeArtworkBySlug['micro-world-safari'],
    displayOrder:2,
  },
  {
    slug:'gravity-defier',
    title:'The Gravity Defier',
    shortDescription:'Can you balance three objects in a way that looks impossible?',
    description:'Make ordinary objects do something unexpected.',
    seoDescription:'A screen-free balancing activity for kids ages 6–12 and families. Arrange three safe, lightweight household objects and see if your surprising stack stands for three seconds.',
    estimatedTime:'No set time; take it at your own pace.',
    materials:'Three safe, lightweight household objects and a low, steady surface.',
    ageGuidance:{
      ages6to8:'Try simple two- or three-object arrangements.',
      ages9to12:'Try more unusual configurations and creative problem-solving.',
    },
    whyInteresting:'Balancing makes trial and error visible: small changes can turn an unlikely arrangement into a stable one.',
    optionalSharingPrompt:'This should not balance… but does it?',
    imageAlt:'A child carefully balances light household objects in a surprising stack.',
    instructions:[
      '1. Choose three safe, lightweight household objects.',
      '2. Try arranging them in a surprising but stable balance on a low, steady surface.',
      '3. Aim to keep the construction standing for three seconds.',
      '4. Let someone guess whether it will work before revealing the result.',
      'Use only suitable lightweight objects, such as cardboard, paper tubes, sponges and empty plastic containers.',
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
      ...(challenge.slug==='shadow-signal'?challenge:{}),
      imageUrl:challengeArtwork(challenge.slug,override?.imageUrl||challenge.imageUrl),
    };
  });
}

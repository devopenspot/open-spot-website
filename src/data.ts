import { Spot } from './types';

export const INITIAL_SPOTS: Spot[] = [
  {
    id: 'venice',
    name: 'VENICE BEACH SKATEPARK',
    city: 'Los Angeles, CA',
    address: '1800 Ocean Front Walk, Venice, CA 90291, United States',
    type: 'Park',
    distance: '1.2 MILES AWAY',
    coordinates: { x: 50, y: 55 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwFs7PjVKv88Xh8vjghVj9YG4TjRGx-cgJeGtpaPOPWgm2tyNTDO1rEZS1OlOE2lW9DdkFo5ujHLabC3Q5Fv5VPqHk7XRm1qZoF_dVB0I5D_6n4WXnG57uafoq1_TdnXnA19xzUgZE60SVBGcnXLbwyXDxzat453qxQAneOVsZDefFLGjfJnE_u1VYgd6fCGCsXQyKpLNvqMERdILE9g_X4DdTec7G2Lyg0-rYRfJRs3FKrOlbaV9JO5vKHAaEXa4Jc6IOR6aVgAFW',
    features: ['Transition', 'Ledges', 'Bowl', 'Smooth Concrete'],
    crowdLevel: 85,
    crowdLevelLabel: 'High (Prime Time: 2PM - 6PM)',
    weather: {
      current: 24,
      forecast: [
        { day: 'TUE', icon: 'sunny', temp: 22 },
        { day: 'WED', icon: 'partly_cloudy_day', temp: 20 },
        { day: 'THU', icon: 'sunny', temp: 23 }
      ]
    },
    communityNote: 'Best sunset session in Cali. Bring wax for the outer ledges. Lights go out at 10 PM. — @skater_vince'
  },
  {
    id: 'rusty-rail',
    name: 'THE RUSTY RAIL',
    city: 'Industrial Park',
    address: 'Warehouse District Sector 4, Los Angeles, CA',
    type: 'DIY',
    distance: '2.5 MILES AWAY',
    coordinates: { x: 40, y: 45 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4v4ktzCapC3vxjuzJzaRJ9rdwhno_7uDS_9aLaQtzSjP8k5qlzK6ZEwa_TP8hp0zUO8p6HI7XK2wqUmhicDsBiasQrZ1uLqRpfGNw0vDN1ePNh9KdYDiAzR5TDZmf4-CKPDRwGgB3tiZsUjyaB3KIuCIziGnviXNy_whwfXLwyDivIdKELRqwOkbWMERLe8g-MXb11ETjJOHc9pvEgM8gEIJ7CWKBtALJQtj98Hofadjua6F9AWKnI9gZd2Gf9z9uD0sZnTQir7p0',
    features: ['Rail', 'Textured Concrete', 'DIY Ledge'],
    crowdLevel: 30,
    crowdLevelLabel: 'Low (Prime Time: 5PM - 8PM)',
    weather: {
      current: 23,
      forecast: [
        { day: 'TUE', icon: 'sunny', temp: 21 },
        { day: 'WED', icon: 'cloudy', temp: 19 },
        { day: 'THU', icon: 'sunny', temp: 22 }
      ]
    },
    communityNote: 'Quiet spot but dusty. Bring a broom. Ledge is waxed. — @street_bmx'
  },
  {
    id: 'white-marble-nine',
    name: 'WHITE MARBLE NINE',
    city: 'Corporate Plaza',
    address: 'Financial District Gateway Plaza, Los Angeles, CA',
    type: 'Stair',
    distance: '6.5 MILES AWAY',
    coordinates: { x: 65, y: 30 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMYD5o83IC77GCwoXZ4TL5QIYhRp7yXRBOsOLR5gaxIwgEcyIgACwPcNKlWqyKiviIBjHLNe53NLhIdvD8LakA9qlCtwhNa50RhZUupTLAU1GA25k9hAvmcWstv2W_NaUW1w0wp1ecJNE75itCTdyQeLQ6oJEeMQ0_a7R2J4yzZ1zsIM-cStztr6Ou5IMd9NMunEC_RempwS3Ihwd1fny1iSMcWtRHo2xpZJ72hCyhC1c6YFnshWOFfR4xNfVJeGHgYukXi5ZHZrH0',
    features: ['9-Stair Set', 'Marble Ledges', 'Metal Handrail'],
    crowdLevel: 60,
    crowdLevelLabel: 'Moderate (Prime Time: 6PM - 9PM)',
    weather: {
      current: 24,
      forecast: [
        { day: 'TUE', icon: 'sunny', temp: 22 },
        { day: 'WED', icon: 'sunny', temp: 21 },
        { day: 'THU', icon: 'sunny', temp: 23 }
      ]
    },
    communityNote: 'Security is chill after 6 PM. Super smooth runway and perfect pop. — @k_flip_lord'
  },
  {
    id: 'sunken-basin',
    name: 'SUNKEN BASIN',
    city: 'Desert Outskirts',
    address: 'Mojave Desert Highway Mile 14, Desert Outskirts, CA',
    type: 'Bowl',
    distance: '45.0 MILES AWAY',
    coordinates: { x: 55, y: 60 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFcsJ_InsjM_V2ZhdORVirVciKPJ2Uqt5Jii3nfPULenttPQ0cUQzaa_C0Yc_NrAv1eAnHIeR8S04LjqVjCQuleF60loO-Mh7UEOwa--QIQwv3VaR_P4gt5B7jfu-3GeKqm5Rf-NV8q0xJxL_FX9JZR0_YLkAMpHPWfXRNDr5THXJbJawrNxG5oJYPI2YICMJAFHJPsYpbPdVHU8lTuqhXRgmObg3ZuVD7VNiZ6NjRXmQfSSW7vx2q43JFz7ckBgTcpMPRzkp67YMT',
    features: ['Empty Pool', 'Transition Coping', 'Desert Landscape'],
    crowdLevel: 10,
    crowdLevelLabel: 'Very Low (Always Open)',
    weather: {
      current: 32,
      forecast: [
        { day: 'TUE', icon: 'sunny', temp: 30 },
        { day: 'WED', icon: 'sunny', temp: 33 },
        { day: 'THU', icon: 'sunny', temp: 34 }
      ]
    },
    communityNote: 'Absolute legendary pool in the desert. Bring lots of water and friends. — @pool_shark'
  },
  {
    id: 'neon-bank-04',
    name: 'NEON BANK 04',
    city: 'Transit Hub',
    address: 'Metro Gateway Terminal, Los Angeles, CA',
    type: 'Plaza',
    distance: '3.8 MILES AWAY',
    coordinates: { x: 58, y: 42 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkyQ6nyDYW-2k9mAn2YgGGqIb9MKFgcR-o0xu6vXXwJ_u6UWqgYys-LlYmLWCsl5ilP-a7ZGki0hb5Rnd4F9CKBF9uk5CzEYNtMvyfcRbxdICJ3q-08SiUbI30hFwDdODciPV3H_z0aqpQ8R80UNezGUBTSknSFN74OkIZ0fmuZXVtWMmko1I-RXcgJI3iouGKwS3_lJUnzvyKUBKdpKQD4UI2wt8s3a0K6V8Be3VBcbHUgvw87qLvLIFZ1w1TamiDJR6OCtsnTfSv',
    features: ['Neon-Lit Banks', 'Ledges', 'Smooth Asphalt'],
    crowdLevel: 45,
    crowdLevelLabel: 'Moderate (Best at Night)',
    weather: {
      current: 18,
      forecast: [
        { day: 'TUE', icon: 'sunny', temp: 17 },
        { day: 'WED', icon: 'partly_cloudy_day', temp: 16 },
        { day: 'THU', icon: 'sunny', temp: 18 }
      ]
    },
    communityNote: 'Incredible night vibes. Well-lit by neon signs. Smooth transition bank. — @nightrider_99'
  },
  {
    id: 'bank-ledge',
    name: 'THE BANK LEDGE',
    city: 'Downtown L.A.',
    address: 'Hope Street Corporate Row, Los Angeles, CA',
    type: 'Ledges',
    distance: '2.4 MILES AWAY',
    coordinates: { x: 42, y: 48 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzOoxxgf8dF_dffEyj1reX-fHjpbmdOzHCKt48IV55g3OcOejsIT9MtaySQEK0hVzvIpPegtGd03j4neTRFC5WGxsEvj5OLJpKfFMhwXdXIY2YAjpD2xwCUOFNv_jCUBDs7mrLeq2J28upIy9Q7fq5m46ytFrpE8efxEcvW-3Bdb4uiMD6QOxExLVPlkQMkRDVmB2DxRfKq8E3Y0pko6HLf3oSNBxhmT5BnVuJ8tSMUEgWQuk_WElNP9xvvc9URbMql80pPwHFxf9P',
    features: ['Waxed Granite Ledge', 'Perfect Flat Ground', 'Bank to Ledge'],
    crowdLevel: 50,
    crowdLevelLabel: 'Medium (Prime Time: 5PM - 7PM)',
    weather: {
      current: 24,
      forecast: [
        { day: 'TUE', icon: 'sunny', temp: 22 },
        { day: 'WED', icon: 'sunny', temp: 20 },
        { day: 'THU', icon: 'sunny', temp: 23 }
      ]
    },
    communityNote: 'Polished granite. Sliding is effortless. Spot is highly active. — @ledge_slayer'
  },
  {
    id: 'underpass-diy',
    name: 'UNDERPASS DIY',
    city: 'East L.A.',
    address: 'I-5 Overpass & 4th St, Los Angeles, CA',
    type: 'DIY',
    distance: '5.1 MILES AWAY',
    coordinates: { x: 35, y: 38 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6GHeF7oipibYvoiyBsC4TPFku7ffQmv6y0B5AvgdhgAmG9pI0BlJLe8-ayJLMlAtDAWwUGu4FAwabH8HuELRowJ3IeEJOlgw4xvg0_RP_eRKPr5eESG5TxVwONEulq3jToyCXr01mrPooWxd_LZyIm1ZjLx-q5OyZPARNZVw0jmm6gY0B_2wuE2kir3siF7K3C7ntb79Rqd-JOHOOpenTRYBWA1KQLZ_r4WVgfahEkzWayr4xRHIqIgYUCuuxsceSaEpXp8segQIg',
    features: ['Concrete Quarterpipes', 'Slappy Curbs', 'Handmade Obstacles'],
    crowdLevel: 75,
    crowdLevelLabel: 'High (Community Hub)',
    weather: {
      current: 24,
      forecast: [
        { day: 'TUE', icon: 'sunny', temp: 23 },
        { day: 'WED', icon: 'partly_cloudy_day', temp: 21 },
        { day: 'THU', icon: 'sunny', temp: 23 }
      ]
    },
    communityNote: 'Rider built and maintained. Respect the spot. Awesome slappy session on weekends. — @diy_crew_la'
  },
  {
    id: 'crystal-stair',
    name: 'CRYSTAL 3-FLAT-3',
    city: 'Century City',
    address: 'Avenue of the Stars Corporate Plaza, Los Angeles, CA',
    type: 'Stair',
    distance: '1.2 MILES AWAY',
    coordinates: { x: 45, y: 52 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCg2LkLdYNUFlK9P261DNdN5fpZLiMVu0k6s-oNF3paCYY-Ibwbom3dofnSOKJ5U-2Ha9ZViFCty1gMT6k406ULoStSMeYcgZBLGTsW3JNdnPSx-5wJypXG6MBajgnSXMQCwrUWXEbh8FMXBVXka0B-o8pUwE4BJuCsP08SDjGFYQeb4KLV-aOIegC3dHgDu92p0ZAgAQRVR1COcvg2RS5HSi2LJaOGLQS-mK8lyq_f4LZEInYadYarh0ckg2paTJ8xjLwQ497zpjDu',
    features: ['3-Flat-3 Stair Set', 'Round Metal Handrail', 'Glass Backdrop'],
    crowdLevel: 20,
    crowdLevelLabel: 'Low (Security Active)',
    weather: {
      current: 23,
      forecast: [
        { day: 'TUE', icon: 'sunny', temp: 22 },
        { day: 'WED', icon: 'sunny', temp: 20 },
        { day: 'THU', icon: 'sunny', temp: 23 }
      ]
    },
    communityNote: 'Security is tight during the day, wait until late evening. Perfect rail alignment. — @rail_rider'
  },
  {
    id: 'orbit-bowl',
    name: 'ORBIT BOWL',
    city: 'Glendora',
    address: 'Glendora Community Park, Glendora, CA',
    type: 'Bowl',
    distance: '0.8 MILES AWAY',
    coordinates: { x: 52, y: 45 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-dyfmp3b-I8wgxije0La0YogzVv8omCt-5kIP1AnhW-sLt4einNRVC3uPdb378hocHx2vuQawtB6Xuoz_ikrEbsaXk8sDmETv0rfniUew0tdN5T4y0I0S5rm-z88AltjgbnvmFIALyeMiTD_Yo1GK7Fr6Jr0kVsmzXbYxlVlQRuMc9Os65-wNdyrEmdme4xtrnScUYWkP-6xYrsXFt87eP8d9jmaEJjSa0KZ2dHWVvueOtapJYUMh3unLvIFRcGvHT_7_Pf4vqjj3',
    features: ['Circular Concrete Bowl', 'Steel Coping', 'Deep End Transitions'],
    crowdLevel: 40,
    crowdLevelLabel: 'Moderate (Prime Time: 3PM - 6PM)',
    weather: {
      current: 25,
      forecast: [
        { day: 'TUE', icon: 'sunny', temp: 24 },
        { day: 'WED', icon: 'sunny', temp: 22 },
        { day: 'THU', icon: 'sunny', temp: 25 }
      ]
    },
    communityNote: 'Smooth, predictable bowl. Fun lines. Local skaters are friendly. — @bowl_carver'
  },
  {
    id: 'ditch-hub',
    name: 'INDUSTRIAL DITCH HUB',
    city: 'The Reservoir',
    address: 'Elysian Valley Spillway Spills, Los Angeles, CA',
    type: 'Pools',
    distance: '3.1 MILES AWAY',
    coordinates: { x: 48, y: 40 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQMlDhlSVNNnIxdi9PPUXtGJ-l_LUYatc_E1_RRHwh6t5D5CbhVLL5PbKYUFHYzqm0H4vlceGPi_jXdgpcycFrchn-jZYMff6yLOkXoECv3Nj-jKep74yqFWMhOe7NjiIEwqFodeaT_dV8RwH8apbz2vTLohzLEJFmjmrpq622c7RCKsViivmbE6sw0BltmoL2E0l8SzYsz68lZf7dT6BlERicTKzJNHrKiPAlvtvKTrMkULOKyuzciVZezUzdJidQdNFoCnMkpXJI',
    features: ['Reservoir Spillway', 'Concrete Ditches', 'Slanted Bank Ride'],
    crowdLevel: 15,
    crowdLevelLabel: 'Low (Spill Check Required)',
    weather: {
      current: 24,
      forecast: [
        { day: 'TUE', icon: 'sunny', temp: 22 },
        { day: 'WED', icon: 'sunny', temp: 21 },
        { day: 'THU', icon: 'sunny', temp: 23 }
      ]
    },
    communityNote: 'Awesome banked ditch. Highly architectural. Must visit when dry. — @ditch_rider_la'
  },
  {
    id: 'marble-8-set',
    name: 'POLISHED MARBLE 8-SET',
    city: 'Civic Center, San Francisco',
    address: 'SF Civic Center Plaza, San Francisco, CA',
    type: 'Stair',
    distance: '380 MILES AWAY',
    coordinates: { x: 20, y: 20 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrY2kzLB1jQqPxx87OqENxBTnqO00sGNmmbFTu7AVZ6r19NZg7MF3fdWdWnI6gGfw_ffMIMDY_Gspts-w017UN_NrCfiVCFhy5StEGoec3EzYvqmTmbz4lzOgjKciS7RV27IOlPVKHiEzli-wdFgHIurqHwm2HE4kDZQEjudqZODIx-_RyULGF_RgAiTpitlMRoYMh6eCL773msOXd0D2xWpsxVBURfxsElH5AvNf3rqCohSNZhAbWwTXOJZZxwY3ShaMJiJ95FWS2',
    features: ['8-Stair Marble Set', 'Polished Marble Ledges', 'Iconic Plaza Vibe'],
    crowdLevel: 80,
    crowdLevelLabel: 'High (Vibrant Skate Community)',
    weather: {
      current: 19,
      forecast: [
        { day: 'TUE', icon: 'cloudy', temp: 18 },
        { day: 'WED', icon: 'partly_cloudy_day', temp: 17 },
        { day: 'THU', icon: 'sunny', temp: 20 }
      ]
    },
    communityNote: 'Legendary plaza. Smooth marble ledges. Watch out for security around noon. — @sf_skate_co'
  },
  {
    id: 'yellow-rail-10',
    name: 'YELLOW RAIL DOWN 10',
    city: 'Westwood High, CA',
    address: 'Westwood High School Corridor, Los Angeles, CA',
    type: 'Stair',
    distance: '4.2 MILES AWAY',
    coordinates: { x: 38, y: 44 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLB-RrcoWBphEwGKz9WC97uP1oAJYGDfaK0Cird3xn0rK3xQH5CBIZrFZWu-OUjGR6zSqWNpdqEJBshASR7_EIyUT4T_Zg2wOLAQtHQdsEejbjM4N--r14ATyr0ZvO95EQSRRByNf9lF9pQsTF8e8ypz-vR2hFmvttHJuWOYSHl5dqAA9LPwPuVxt1tnOJNTTyg-AYohnYU2gNU2GA0VHGn60oM1SIk4J_zMEn9rikwSsJxM7UGWLPvMaZeN-MzfNKFPCNmn8Uq8T4',
    features: ['10-Stair Set', 'Yellow Metal Handrail', 'Smooth Landing Runway'],
    crowdLevel: 55,
    crowdLevelLabel: 'Moderate (Schoolyard Spot)',
    weather: {
      current: 23,
      forecast: [
        { day: 'TUE', icon: 'sunny', temp: 22 },
        { day: 'WED', icon: 'sunny', temp: 20 },
        { day: 'THU', icon: 'sunny', temp: 23 }
      ]
    },
    communityNote: 'Legendary schoolyard rail. High quality metal. Session on weekends or after hours. — @westwood_rep'
  }
];

export const EXPLORE_CATEGORIES = [
  {
    name: 'Skate',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIsHwlYWNOO2JOzElIzEveW3zMgE50hH73aPeo2zDSno1jYKX-MuJVOnm2MeEuIrwB23TqF7dexScJl5yykFMJPZG_u48Isx6KwMt-QCkjx0dzoq2eBBxmLrpRZBYvNrOztpEkfKR1uLCMsblNwD8s_GChBm7JwVNg9Y96wN4hyCKHWNnJ0c3m2_iWBu-TvdA_SKwriZWnC3Uk73sosPmxqwYo_djOyzZ6PDlASpi-j2hNgSQIm1k7QVLKXxxL4GZpTbNRYGUeu_Zd'
  },
  {
    name: 'BMX',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCasQr-YMW-ZXIu3aaUisuxky4CF5pezxlnLuHvC5GHDgQm-7mw1ot3Q_bcJ1gGwzgS6PAOaKCcpicVloRAlnoratOOiEX7-0oUrUGjzcGYAPNyGLhYVaBg4CCygKeQkHkO9Osg19TQ0hwL5PIg5_-I_jl6G9dh3YMIXZWRhz56NANKaSB_L5RH-zQf1oZhlP5fvk_uD_cmalW9JrPTFG5UARWtYDdvasMj9ePpB61eIthqXKRxoaw7liGQPKr6A1AJYkKB3usd5bEO'
  }
];

export const LEGENDARY_TERRAINS = [
  {
    name: 'Pier 7',
    desc: 'The Holy Grail of manual pads and ledges.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtLPU26ca3lCjW2XocJ4xWhnksYjvRFwM796z1gLUN2ryb6_Yjg3yPGHF2pYX8G_p05yeox9oI83tU03iiCjPc4GAk8IhiFyp0mCaQ8lWDKGAum7yReXxdOSzUqk_Iwy2WVpzhGPcmCbR9-tzCMHT9IJEfQYU-nhiCII-okfkSVIuBVeKUA0Qiue9xcsgT9NfDMye07MXCnxSSeJuxOBoCiXyk2h1YBSZdLwpfutJL8tj8bw3BzlsUimJQDyffjTb6FvPGufJjBCof'
  },
  {
    name: 'Love Park',
    desc: 'Plaza perfection reincarnated in heritage.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnu2GS8IXCYdiWV8pUgNYV6QFtW36CbzfAqH2Vt4Om9cNK-0L9QN4OYVuWYYyrImLroZo7D4Y_X8DcCEKKcyRr9sVsHMeP82mfjK1LRoV8XLyiOnKkCocptM-qFr5FQcIKrnA7ExDTFSGeawHG6jszFIADVZ9sdqfSFn68i4uPpYTM1qI7Yhq5Man9fX9-mSZv2RW6tUZA0aklHy1hhM7Ls1vTXzPRNUsrOKaQMOjmS3BKg1WJyjLdQSbMYJ_EfYNJI3OLast5HqQ5'
  },
  {
    name: 'Southbank',
    desc: 'Gritty, loud, and quintessentially London.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZXvBJoa7ve-xzGF8bcs82ADBu-4LHeHfyxJAl-1li0JS5EicyQprhZ-rRbjMXWo-aDn5POyDgzworiM0la-3C-tsZOrbPL9Gk0arTZ_2yRfrwvJqAeXGekORuNyeF7QOKw0hwBPcAW6xjYdEu6WBTtZRGO4GJBDbNylyxnqsR430Q1SRd4LTtA6FCua8D3gBLacF5ZFa5Zdoijjd7yadwheA0hjuNuJ_1qIfBNwlbVXBZOjCBKXyyesLz7CFCWb4fWgWzI6zRFWm9'
  },
  {
    name: 'Macba',
    desc: 'The grand theater of modern technical skating.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQriqRuUJXG2dJ9Ih9qGRsFazXRDcK9TKFT2TwEkIST9-qxzkXpZdUsf1956lF1esHDkOJayMx8WKwNJNQNcRWqvDhcvRHal-KyP-KuuqedcLffPGHTjMgsR3gB_aLw7q3OdgdUIyLSNmyEjt7fS45kwIjp_zRaDqMUnC1uuMIKNy3nvVE7SlpMpAzlxyznpuvEghirVJDhxYMslvdI-ZM2fV6FsJtfV7Y3dOmOswxlD6Yq0rRB8-Ou6vfsUARnYTDcNDXl01Awo_t'
  },
  {
    name: 'EMB',
    desc: "San Francisco's most brutalist brick canvas.",
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnp_-uurAhnxP-55IV5gu714rG-7ru9R68lfXR3zUo6y9meAPP1CyRNI2e2GKwzsozDJOqUAE9xLxg-ENQ4F2mRMY6MUI1D3qHdzbdNwYyosPJ8LHMaMYtqkCdh1kpyyEwPuHTde8114DqK1pn-tqL8wyqyVDnnTNC0mcUeIInIRxSCLCMOCom4ziXgwahyFzKkUPS5dXA0mP_zE6p3d7-NlenQwxaKMidLLy3SwlKGk89G7HJUkqYlyh78POw6umte9MGxhWzVaJT'
  }
];

export const REGIONS_DATA = [
  {
    name: 'Americas',
    desc: 'The birthplace of modern street skating. From LA plazas to NYC rough spots.',
    count: '1.2k Spots',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOGT4RjC_f8LEOXu8S-BRUxgbzarq84gQHvcGO1K3d6--lyAQLGuKp0AG8KalE9U0XUF66JNSyZEJ7POYJjTn7MvNO7ugKuJoPzBALxR6XRZL3aIXIh2SnlUixMIJNPC5wSzmc4Vcjo03cECPDHRZXP25f8AK-xPcVKzHsen9nyFbli-eRLlJTneta4ocXdLbbBTlsfQzF09Lj2OgidpgdqZQGhf993kRsH5AhAVFQgRyJZlUAfuvueff7tOSaU006jyAkpJX1QHQh'
  },
  {
    name: 'Europe',
    desc: 'Marble plazas and historic architecture meet modern DIY spirit in every capital.',
    count: '840 Spots',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMjTAsfqYsfIa-J3FbGvL438k-wnv9hmGvtFxql96WByww-EpeLFtCDM7JhJWgWICRd9F53Xhr4ozXqMFFoGRc_Wjle17Xdm4g-0cZ3xWI6HJSP0uQ9PXlFXwYFpcl-JdQmqJiXS9s2QQvtGd2KCqYp_HNf5GYXRoHbTai5x7U1Imf3k2RxiKjV6WHCU0NK6LyTNbCyboR-7ZMz2_48kq61xmjwHdhML2G2F3rTWv0CdOre0xsLga_xyZy2gf65mCXN53bDlWuxWb5'
  },
  {
    name: 'Asia',
    desc: 'Infinite concrete possibilities. Pristine marble ledges and neon-lit night sessions.',
    count: '620 Spots',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYoMVU5vMSIEK35AW46DYG-fQ9WfAoKHQkb_4ukHQYUGRG_PRXomLKHdJjLGAAObuZwc2iRUulbRaAGLi1f9zcExfl3fvsAKslgpL0nmCqvUlaU733G9O2mEHkmoxY2hF0PVtKTvBNHvheJClaq80UJvkXRizlg0jOFO7Bmy5wEyYoDWq4Xd0Qzhar8zYpPh5VTOXYdRO6IhDFLjKPolxSiNF91vLqCIGeZqnZCv5A8Rsg9UPSvQfFGOlOUnkk40YAyHBq6PkfAbt5'
  }
];

export const POPULAR_SEARCH_TERMS = [
  'Barcelona Skateboarding',
  'New York DIY Spots',
  'London Bowls',
  'BMX Trails'
];

export const RECENT_SEARCHES = [
  'Southbank Skatepark',
  'Paris Street League',
  'Berlin Bowl Session'
];

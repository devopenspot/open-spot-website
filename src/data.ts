import type {
  ExploreCategory,
  LegendaryTerrain,
  PresetImage,
  Region,
  TerrainOption,
} from "@/lib/types";

export const EXPLORE_CATEGORIES: readonly ExploreCategory[] = [
  {
    name: "Skate",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCIsHwlYWNOO2JOzElIzEveW3zMgE50hH73aPeo2zDSno1jYKX-MuJVOnm2MeEuIrwB23TqF7dexScJl5yykFMJPZG_u48Isx6KwMt-QCkjx0dzoq2eBBxmLrpRZBYvNrOztpEkfKR1uLCMsblNwD8s_GChBm7JwVNg9Y96wN4hyCKHWNnJ0c3m2_iWBu-TvdA_SKwriZWnC3Uk73sosPmxqwYo_djOyzZ6PDlASpi-j2hNgSQIm1k7QVLKXxxL4GZpTbNRYGUeu_Zd",
  },
  {
    name: "BMX",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCasQr-YMW-ZXIu3aaUisuxky4CF5pezxlnLuHvC5GHDgQm-7mw1ot3Q_bcJ1gGwzgS6PAOaKCcpicVloRAlnoratOOiEX7-0oUrUGjzcGYAPNyGLhYVaBg4CCygKeQkHkO9Osg19TQ0hwL5PIg5_-I_jl6G9dh3YMIXZWRhz56NANKaSB_L5RH-zQf1oZhlP5fvk_uD_cmalW9JrPTFG5UARWtYDdvasMj9ePpB61eIthqXKRxoaw7liGQPKr6A1AJYkKB3usd5bEO",
  },
  {
    name: "Rollerblade",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCasQr-YMW-ZXIu3aaUisuxky4CF5pezxlnLuHvC5GHDgQm-7mw1ot3Q_bcJ1gGwzgS6PAOaKCcpicVloRAlnoratOOiEX7-0oUrUGjzcGYAPNyGLhYVaBg4CCygKeQkHkO9Osg19TQ0hwL5PIg5_-I_jl6G9dh3YMIXZWRhz56NANKaSB_L5RH-zQf1oZhlP5fvk_uD_cmalW9JrPTFG5UARWtYDdvasMj9ePpB61eIthqXKRxoaw7liGQPKr6A1AJYkKB3usd5bEO",
  },
  {
    name: "Scooter",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCasQr-YMW-ZXIu3aaUisuxky4CF5pezxlnLuHvC5GHDgQm-7mw1ot3Q_bcJ1gGwzgS6PAOaKCcpicVloRAlnoratOOiEX7-0oUrUGjzcGYAPNyGLhYVaBg4CCygKeQkHkO9Osg19TQ0hwL5PIg5_-I_jl6G9dh3YMIXZWRhz56NANKaSB_L5RH-zQf1oZhlP5fvk_uD_cmalW9JrPTFG5UARWtYDdvasMj9ePpB61eIthqXKRxoaw7liGQPKr6A1AJYkKB3usd5bEO",
  },
] as const;

export const LEGENDARY_TERRAINS: readonly LegendaryTerrain[] = [
  {
    name: "Pier 7",
    desc: "The Holy Grail of manual pads and ledges.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBtLPU26ca3lCjW2XocJ4xWhnksYjvRFwM796z1gLUN2ryb6_Yjg3yPGHF2pYX8G_p05yeox9oI83tU03iiCjPc4GAk8IhiFyp0mCaQ8lWDKGAum7yReXxdOSzUqk_Iwy2WVpzhGPcmCbR9-tzCMHT9IJEfQYU-nhiCII-okfkSVIuBVeKUA0Qiue9xcsgT9NfDMye07MXCnxSSeJuxOBoCiXyk2h1YBSZdLwpfutJL8tj8bw3BzlsUimJQDyffjTb6FvPGufJjBCof",
  },
  {
    name: "Love Park",
    desc: "Plaza perfection reincarnated in heritage.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBnu2GS8IXCYdiWV8pUgNYV6QFtW36CbzfAqH2Vt4Om9cNK-0L9QN4OYVuWYYyrImLroZo7D4Y_X8DcCEKKcyRr9sVsHMeP82mfjK1LRoV8XLyiOnKkCocptM-qFr5FQcIKrnA7ExDTFSGeawHG6jszFIADVZ9sdqfSFn68i4uPpYTM1qI7Yhq5Man9fX9-mSZv2RW6tUZA0aklHy1hhM7Ls1vTXzPRNUsrOKaQMOjmS3BKg1WJyjLdQSbMYJ_EfYNJI3OLast5HqQ5",
  },
  {
    name: "Southbank",
    desc: "Gritty, loud, and quintessentially London.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAZXvBJoa7ve-xzGF8bcs82ADBu-4LHeHfyxJAl-1li0JS5EicyQprhZ-rRbjMXWo-aDn5POyDgzworiM0la-3C-tsZOrbPL9Gk0arTZ_2yRfrwvJqAeXGekORuNyeF7QOKw0hwBPcAW6xjYdEu6WBTtZRGO4GJBDbNylyxnqsR430Q1SRd4LTtA6FCua8D3gBLacF5ZFa5Zdoijjd7yadwheA0hjuNuJ_1qIfBNwlbVXBZOjCBKXyyesLz7CFCWb4fWgWzI6zRFWm9",
  },
  {
    name: "Macba",
    desc: "The grand theater of modern technical skating.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCQriqRuUJXG2dJ9Ih9qGRsFazXRDcK9TKFT2TwEkIST9-qxzkXpZdUsf1956lF1esHDkOJayMx8WKwNJNQNcRWqvDhcvRHal-KyP-KuuqedcLffPGHTjMgsR3gB_aLw7q3OdgdUIyLSNmyEjt7fS45kwIjp_zRaDqMUnC1uuMIKNy3nvVE7SlpMpAzlxyznpuvEghirVJDhxYMslvdI-ZM2fV6FsJtfV7Y3dOmOswxlD6Yq0rRB8-Ou6vfsUARnYTDcNDXl01Awo_t",
  },
  {
    name: "EMB",
    desc: "San Francisco's most brutalist brick canvas.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCnp_-uurAhnxP-55IV5gu714rG-7ru9R68lfXR3zUo6y9meAPP1CyRNI2e2GKwzsozDJOqUAE9xLxg-ENQ4F2mRMY6MUI1D3qHdzbdNwYyosPJ8LHMaMYtqkCdh1kpyyEwPuHTde8114DqK1pn-tqL8wyqyVDnnTNC0mcUeIInIRxSCLCMOCom4ziXgwahyFzKkUPS5dXA0mP_zE6p3d7-NlenQwxaKMidLLy3SwlKGk89G7HJUkqYlyh78POw6umte9MGxhWzVaJT",
  },
] as const;

export const REGIONS_DATA: readonly Region[] = [
  {
    name: "Americas",
    desc: "The birthplace of modern street skating. From LA plazas to NYC rough spots.",
    count: "1.2k Spots",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCOGT4RjC_f8LEOXu8S-BRUxgbzarq84gQHvcGO1K3d6--lyAQLGuKp0AG8KalE9U0XUF66JNSyZEJ7POYJjTn7MvNO7ugKuJoPzBALxR6XRZL3aIXIh2SnlUixMIJNPC5wSzmc4Vcjo03cECPDHRZXP25f8AK-xPcVKzHsen9nyFbli-eRLlJTneta4ocXdLbbBTlsfQzF09Lj2OgidpgdqZQGhf993kRsH5AhAVFQgRyJZlUAfuvueff7tOSaU006jyAkpJX1QHQh",
  },
  {
    name: "Europe",
    desc: "Marble plazas and historic architecture meet modern DIY spirit in every capital.",
    count: "840 Spots",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBMjTAsfqYsfIa-J3FbGvL438k-wnv9hmGvtFxql96WByww-EpeLFtCDM7JhJWgWICRd9F53Xhr4ozXqMFFoGRc_Wjle17Xdm4g-0cZ3xWI6HJSP0uQ9PXlFXwYFpcl-JdQmqJiXS9s2QQvtGd2KCqYp_HNf5GYXRoHbTai5x7U1Imf3k2RxiKjV6WHCU0NK6LyTNbCyboR-7ZMz2_48kq61xmjwHdhML2G2F3rTWv0CdOre0xsLga_xyZy2gf65mCXN53bDlWuxWb5",
  },
  {
    name: "Asia",
    desc: "Infinite concrete possibilities. Pristine marble ledges and neon-lit night sessions.",
    count: "620 Spots",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYoMVU5vMSIEK35AW46DYG-fQ9WfAoKHQkb_4ukHQYUGRG_PRXomLKHdJjLGAAObuZwc2iRUulbRaAGLi1f9zcExfl3fvsAKslgpL0nmCqvUlaU733G9O2mEHkmoxY2hF0PVtKTvBNHvheJClaq80UJvkXRizlg0jOFO7Bmy5wEyYoDWq4Xd0Qzhar8zYpPh5VTOXYdRO6IhDFLjKPolxSiNF91vLqCIGeZqnZCv5A8Rsg9UPSvQfFGOlOUnkk40YAyHBq6PkfAbt5",
  },
] as const;

export const POPULAR_SEARCH_TERMS: readonly string[] = [
  "Barcelona Skateboarding",
  "New York DIY Spots",
  "London Bowls",
  "BMX Trails",
] as const;

export const RECENT_SEARCHES: readonly string[] = [
  "Southbank Skatepark",
  "Paris Street League",
  "Berlin Bowl Session",
] as const;

export const DEFAULT_PRESET_IMAGES: readonly PresetImage[] = [
  {
    name: "Industrial Ledge",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzOoxxgf8dF_dffEyj1reX-fHjpbmdOzHCKt48IV55g3OcOejsIT9MtaySQEK0hVzvIpPegtGd03j4neTRFC5WGxsEvj5OLJpKfFMhwXdXIY2YAjpD2xwCUOFNv_jCUBDs7mrLeq2J28upIy9Q7fq5m46ytFrpE8efxEcvW-3Bdb4uiMD6QOxExLVPlkQMkRDVmB2DxRfKq8E3Y0pko6HLf3oSNBxhmT5BnVuJ8tSMUEgWQuk_WElNP9xvvc9URbMql80pPwHFxf9P",
  },
  {
    name: "Metro Underpass",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6GHeF7oipibYvoiyBsC4TPFku7ffQmv6y0B5AvgdhgAmG9pI0BlJLe8-ayJLMlAtDAWwUGu4FAwabH8HuELRowJ3IeEJOlgw4xvg0_RP_eRKPr5eESG5TxVwONEulq3jToyCXr01mrPooWxd_LZyIm1ZjLx-q5OyZPARNZVw0jmm6gY0B_2wuE2kir3siF7K3C7ntb79Rqd-JOHOOpenTRYBWA1KQLZ_r4WVgfahEkzWayr4xRHIqIgYUCuuxsceSaEpXp8segQIg",
  },
  {
    name: "Marble Stair Run",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCrY2kzLB1jQqPxx87OqENxBTnqO00sGNmmbFTu7AVZ6r19NZg7MF3fdWdWnI6gGfw_ffMIMDY_Gspts-w017UN_NrCfiVCFhy5StEGoec3EzYvqmTmbz4lzOgjKciS7RV27IOlPVKHiEzli-wdFgHIurqHwm2HE4kDZQEjudqZODIx-_RyULGF_RgAiTpitlMRoYMh6eCL773msOXd0D2xWpsxVBURfxsElH5AvNf3rqCohSNZhAbWwTXOJZZxwY3ShaMJiJ95FWS2",
  },
  {
    name: "Desert Basin Ditch",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBFcsJ_InsjM_V2ZhdORVirVciKPJ2Uqt5Jii3nfPULenttPQ0cUQzaa_C0Yc_NrAv1eAnHIeR8S04LjqVjCQuleF60loO-Mh7UEOwa--QIQwv3VaR_P4gt5B7jfu-3GeKqm5Rf-NV8q0xJxL_FX9JZR0_YLkAMpHPWfXRNDr5THXJbJawrNxG5oJYPI2YICMJAFHJPsYpbPdVHU8lTuqhXRgmObg3ZuVD7VNiZ6NjRXmQfSSW7vx2q43JFz7ckBgTcpMPRzkp67YMT",
  },
] as const;

export const TERRAIN_OPTIONS: readonly TerrainOption[] = [
  { value: "Plaza", label: "Plaza" },
  { value: "DIY", label: "DIY" },
  { value: "Stair", label: "Stair set" },
  { value: "Bowl", label: "Bowl" },
  { value: "Park", label: "Skatepark" },
  { value: "Ledges", label: "Ledges" },
  { value: "Pools", label: "Pools" },
] as const;

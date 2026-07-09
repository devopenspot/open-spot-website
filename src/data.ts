import type { PresetImage, Region } from "@/lib/types";

export const REGIONS_DATA: readonly Region[] = [
  {
    name: "Americas",
    desc: "The birthplace of modern street skating. From LA plazas to NYC rough spots.",
    count: "1.2k Spots",
    link: "/map?region=americas",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCOGT4RjC_f8LEOXu8S-BRUxgbzarq84gQHvcGO1K3d6--lyAQLGuKp0AG8KalE9U0XUF66JNSyZEJ7POYJjTn7MvNO7ugKuJoPzBALxR6XRZL3aIXIh2SnlUixMIJNPC5wSzmc4Vcjo03cECPDHRZXP25f8AK-xPcVKzHsen9nyFbli-eRLlJTneta4ocXdLbbBTlsfQzF09Lj2OgidpgdqZQGhf993kRsH5AhAVFQgRyJZlUAfuvueff7tOSaU006jyAkpJX1QHQh",
    countries: [
      "United States",
      "Canada",
      "Mexico",
      "Brazil",
      "Argentina",
      "Colombia",
      "Chile",
      "Peru",
    ],
  },
  {
    name: "Europe",
    desc: "Marble plazas and historic architecture meet modern DIY spirit in every capital.",
    count: "840 Spots",
    link: "/map?region=europe",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBMjTAsfqYsfIa-J3FbGvL438k-wnv9hmGvtFxql96WByww-EpeLFtCDM7JhJWgWICRd9F53Xhr4ozXqMFFoGRc_Wjle17Xdm4g-0cZ3xWI6HJSP0uQ9PXlFXwYFpcl-JdQmqJiXS9s2QQvtGd2KCqYp_HNf5GYXRoHbTai5x7U1Imf3k2RxiKjV6WHCU0NK6LyTNbCyboR-7ZMz2_48kq61xmjwHdhML2G2F3rTWv0CdOre0xsLga_xyZy2gf65mCXN53bDlWuxWb5",
    countries: [
      "France",
      "Germany",
      "United Kingdom",
      "Italy",
      "Spain",
      "Netherlands",
      "Portugal",
      "Sweden",
    ],
  },
  {
    name: "Asia",
    desc: "Infinite concrete possibilities. Pristine marble ledges and neon-lit night sessions.",
    count: "620 Spots",
    link: "/map?region=asia",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYoMVU5vMSIEK35AW46DYG-fQ9WfAoKHQkb_4ukHQYUGRG_PRXomLKHdJjLGAAObuZwc2iRUulbRaAGLi1f9zcExfl3fvsAKslgpL0nmCqvUlaU733G9O2mEHkmoxY2hF0PVtKTvBNHvheJClaq80UJvkXRizlg0jOFO7Bmy5wEyYoDWq4Xd0Qzhar8zYpPh5VTOXYdRO6IhDFLjKPolxSiNF91vLqCIGeZqnZCv5A8Rsg9UPSvQfFGOlOUnkk40YAyHBq6PkfAbt5",
    countries: [
      "Japan",
      "South Korea",
      "China",
      "Thailand",
      "Singapore",
      "Indonesia",
      "Philippines",
      "Malaysia",
    ],
  },
] as const;

export const COUNTRY_NAME_OVERRIDES: Readonly<Record<string, string>> = {
  Deutschland: "Germany",
  Italia: "Italy",
  España: "Spain",
  Brasil: "Brazil",
  日本: "Japan",
  한국: "South Korea",
  中国: "China",
} as const;

export const COUNTRY_TO_REGION: Readonly<Record<string, string>> =
  REGIONS_DATA.reduce(
    (acc, region) => {
      for (const country of region.countries) {
        acc[country] = region.name;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

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

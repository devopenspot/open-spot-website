import type { Region } from "@/lib/types"

export const REGION_SEED: readonly (Region & { slug: string })[] = [
  {
    name: "Americas",
    slug: "americas",
    desc: "The birthplace of modern street skating. From LA plazas to NYC rough spots.",
    count: "0 Spots",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCOGT4RjC_f8LEOXu8S-BRUxgbzarq84gQHvcGO1K3d6--lyAQLGuKp0AG8KalE9U0XUF66JNSyZEJ7POYJjTn7MvNO7ugKuJoPzBALxR6XRZL3aIXIh2SnlUixMIJNPC5wSzmc4Vcjo03cECPDHRZXP25f8AK-xPcVKzHsen9nyFbli-eRLlJTneta4ocXdLbbBTlsfQzF09Lj2OgidpgdqZQGhf993kRsH5AhAVFQgRyJZlUAfuvueff7tOSaU006jyAkpJX1QHQh",
    link: "/map?region=americas",
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
    slug: "europe",
    desc: "Marble plazas and historic architecture meet modern DIY spirit in every capital.",
    count: "0 Spots",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBMjTAsfqYsfIa-J3FbGvL438k-wnv9hmGvtFxql96WByww-EpeLFtCDM7JhJWgWICRd9F53Xhr4ozXqMFFoGRc_Wjle17Xdm4g-0cZ3xWI6HJSP0uQ9PXlFXwYFpcl-JdQmqJiXS9s2QQvtGd2KCqYp_HNf5GYXRoHbTai5x7U1Imf3k2RxiKjV6WHCU0NK6LyTNbCyboR-7ZMz2_48kq61xmjwHdhML2G2F3rTWv0CdOre0xsLga_xyZy2gf65mCXN53bDlWuxWb5",
    link: "/map?region=europe",
    countries: [
      "France",
      "Germany",
      "United Kingdom",
      "Italy",
      "Spain",
      "Netherlands",
      "Portugal",
      "Sweden",
      "Finland",
    ],
  },
  {
    name: "Asia",
    slug: "asia",
    desc: "Infinite concrete possibilities. Pristine marble ledges and neon-lit night sessions.",
    count: "0 Spots",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYoMVU5vMSIEK35AW46DYG-fQ9WfAoKHQkb_4ukHQYUGRG_PRXomLKHdJjLGAAObuZwc2iRUulbRaAGLi1f9zcExfl3fvsAKslgpL0nmCqvUlaU733G9O2mEHkmoxY2hF0PVtKTvBNHvheJClaq80UJvkXRizlg0jOFO7Bmy5wEyYoDWq4Xd0Qzhar8zYpPh5VTOXYdRO6IhDFLjKPolxSiNF91vLqCIGeZqnZCv5A8Rsg9UPSvQfFGOlOUnkk40YAyHBq6PkfAbt5",
    link: "/map?region=asia",
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
]

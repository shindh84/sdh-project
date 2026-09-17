export const MOODS = ["playful", "warm", "curator"] as const;
export type Mood = (typeof MOODS)[number];

export const MOOD_LABEL: Record<Mood, string> = {
  playful: "유쾌하게",
  warm: "따뜻하게",
  curator: "진지한 큐레이터처럼",
};

export const DEFAULT_MOOD: Mood = "warm";

// 사진을 정사각형 틀에 배치할 때 기준으로 삼을 초점(object-position, 0~100%).
// 기본값은 정중앙이며, 사용자가 슬라이더로 위치만 옮긴다 (잘라내는 영역 자체는 항상 정사각형 전체).
export type PhotoCrop = {
  x: number;
  y: number;
};

export const DEFAULT_PHOTO_CROP: PhotoCrop = { x: 50, y: 50 };

export type Visibility = "private" | "link";

export type Exhibit = {
  id: string;
  ownerId: string;
  itemName: string;
  story: string;
  mood: Mood;
  title: string;
  description: string;
  photoPath: string;
  photoCrop: PhotoCrop;
  showStory: boolean;
  displayName: string | null;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
};

// DB row (snake_case) <-> 앱 도메인 타입(camelCase) 변환.
export type ExhibitRow = {
  id: string;
  owner_id: string;
  item_name: string;
  story: string;
  mood: string;
  title: string;
  description: string;
  photo_path: string;
  photo_crop: PhotoCrop;
  show_story: boolean;
  display_name: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
};

export function fromRow(row: ExhibitRow): Exhibit {
  return {
    id: row.id,
    ownerId: row.owner_id,
    itemName: row.item_name,
    story: row.story,
    mood: row.mood as Mood,
    title: row.title,
    description: row.description,
    photoPath: row.photo_path,
    photoCrop: row.photo_crop,
    showStory: row.show_story,
    displayName: row.display_name,
    visibility: row.visibility as Visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

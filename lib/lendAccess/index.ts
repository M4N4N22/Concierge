export {
  SHARE_SLICE_SCHEMA,
  ACCESS_PASS_SCHEMA,
  USE_HISTORY_SCHEMA,
  emptyUseHistory,
  type ShareSlice,
  type AccessPass,
  type UseMark,
  type UseHistory,
  type VaultShareItem,
} from "@/lib/lendAccess/types";

export {
  DEFAULT_SHARE_SLICES,
  getShareSlice,
  listShareableSlices,
  listOwnerOnlySlices,
  filterItemsForSlice,
  draftShareSlice,
} from "@/lib/lendAccess/slices";

export {
  draftAccessPass,
  isPassActive,
  revokePass,
  expirePassIfNeeded,
} from "@/lib/lendAccess/grants";

export { appendUseMark, countMarksByKind } from "@/lib/lendAccess/history";

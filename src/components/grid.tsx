import { Box } from "@/components/ui/box";

/**
 * Empty cells that pad out the final row of a `numColumns` FlatList.
 *
 * Grid cells are `flex-1` so they share the row evenly, but a last row that is
 * not full lets its items grow over the leftover space instead of keeping the
 * column width. Rendering these alongside the last item gives that space a
 * placeholder to go to. They are siblings of the item inside the row wrapper,
 * so the wrapper's gap applies to them as it does to real cells.
 */
export default function RowFillers({
  index,
  total,
  columns,
}: {
  index: number;
  total: number;
  columns: number;
}) {
  const remainder = total % columns;
  if (index !== total - 1 || remainder === 0) return null;

  return Array.from({ length: columns - remainder }, (_, i) => (
    <Box key={i} className="flex-1" />
  ));
}

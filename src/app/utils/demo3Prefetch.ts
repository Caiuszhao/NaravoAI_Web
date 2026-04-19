/**
 * All possible "next clip" filenames to prefetch while `currentFilename` is playing.
 * Includes queue[0] and every branch head reachable from the current decision point.
 */
export function getDemo3PrefetchFilenames(currentFilename: string, queue: string[]): string[] {
  const out = new Set<string>();
  if (queue[0]) out.add(queue[0]);

  switch (currentFilename) {
    case 'index_1.mp4':
      out.add('ep_2.mp4');   // this is the input video
      out.add('ep_4_1.mp4');
      out.add('ep_4_3.mp4');  
      out.add('ep_3_1.mp4');
      out.add('ep_3_2.mp4');
      out.add('ep_3_3.mp4');
      break;
    case 'ep_2.mp4':
      out.add('ep_4_1.mp4');
      out.add('ep_4_3.mp4');  
      out.add('ep_3_1.mp4');
      out.add('ep_3_2.mp4');
      out.add('ep_3_3.mp4');
      break;
    case 'ep4_2.mp4':      // this is the input video
      out.add('ep_3_1.mp4');
      out.add('ep_3_2.mp4');
      out.add('ep_3_3.mp4');
      out.add('ep_3-4.mp4');
      out.add('ep_3_6.mp4');
      out.add('ep_5.mp4');
      break;
    case 'ep_4_1.mp4':
      out.add('ep4_2.mp4');  // this is the input video
      // Prefetch outcomes of the next decision point (ep4_2) while retry clip is playing.
      out.add('ep_3_1.mp4');
      out.add('ep_3_2.mp4');
      out.add('ep_3_3.mp4');
      out.add('ep_3-4.mp4');
      out.add('ep_3_6.mp4');
      out.add('ep_5.mp4');
      break;
    case 'ep_4_3.mp4':
      out.add('ep_4_4.mp4');
      // Prefetch outcomes of the next decision point (ep_4_4) while ep_4_3 is playing.
      out.add('ep_3_1.mp4');
      out.add('ep_3_2.mp4');
      out.add('ep_3_3.mp4');
      out.add('ep_3_6.mp4');
      out.add('ep_3-4.mp4');
      out.add('ep_5.mp4');
      break;
    case 'ep_4_4.mp4':    // this is the input video
      out.add('ep_3_1.mp4');
      out.add('ep_3_2.mp4');
      out.add('ep_3_3.mp4');
      out.add('ep_3_6.mp4');
      out.add('ep_3-4.mp4');
      out.add('ep_5.mp4');
      break;
    case 'ep_3-4.mp4':
      out.add('ep_3_1.mp4');
      out.add('ep_3_2.mp4');
      out.add('ep_3_3.mp4');
      out.add('ep_3_5.mp4');
      out.add('ep_3_6.mp4');
      out.add('ep_5.mp4');
      break;
    case 'ep_3_1.mp4':
    case 'ep_3_2.mp4':
    case 'ep_3_3.mp4':
    case 'ep_3_5.mp4':
    case 'ep_3_6.mp4':
      out.add('ep_5.mp4');
      break;
    case 'ep_5.mp4':
      out.add('ep_last.mp4');
      break;
    default:
      break;
  }

  return [...out];
}

/**
 * After the playing clip (`currentFilename`), prefetch order for the parallel wave:
 * 1) `queue[0]` (immediate next file) when present
 * 2) other heads from `getDemo3PrefetchFilenames` in graph order (Set insertion order from that helper)
 */
function buildParallelPrefetchOrder(currentFilename: string, queue: string[], reachable: Set<string>): string[] {
  const hintList = getDemo3PrefetchFilenames(currentFilename, queue);
  const ordered: string[] = [];
  const used = new Set<string>();
  used.add(currentFilename);

  const q0 = queue[0];
  if (q0 && reachable.has(q0)) {
    ordered.push(q0);
    used.add(q0);
  }
  for (const f of hintList) {
    if (reachable.has(f) && !used.has(f)) {
      ordered.push(f);
      used.add(f);
    }
  }
  return ordered;
}

/**
 * Prefetch staging (all clips, same shape as `index_1` in `LegacyDemoScreen`):
 * - **warmupFilenames**: only the clip currently playing (resolve + decoder warmup before parallel work).
 * - **backgroundFilenames**: `queue[0]` first (highest priority), then other reachable branch heads — all loaded **in parallel** with resolve + decoder warmup.
 */
export function getDemo3PrefetchStaged(
  currentFilename: string,
  queue: string[]
): { warmupFilenames: string[]; backgroundFilenames: string[] } {
  const reachable = new Set<string>([currentFilename, ...getDemo3PrefetchFilenames(currentFilename, queue)]);

  if (currentFilename === 'index_1.mp4') {
    const warmup = ['index_1.mp4'].filter((f) => reachable.has(f));
    const parallelWave = [
      'ep_2.mp4',
      'ep_4_1.mp4',
      'ep_4_3.mp4',
      'ep_3_1.mp4',
      'ep_3_2.mp4',
      'ep_3_3.mp4',
    ];
    const used = new Set(warmup);
    const backgroundOrdered = parallelWave.filter((f) => reachable.has(f) && !used.has(f));
    for (const f of backgroundOrdered) used.add(f);
    const rest = [...reachable].filter((f) => !used.has(f));
    rest.sort();
    return { warmupFilenames: warmup, backgroundFilenames: [...backgroundOrdered, ...rest] };
  }

  const warmup = [currentFilename].filter((f) => reachable.has(f));
  const used = new Set(warmup);
  const parallelCore = buildParallelPrefetchOrder(currentFilename, queue, reachable);
  const backgroundOrdered = parallelCore.filter((f) => reachable.has(f) && !used.has(f));
  for (const f of backgroundOrdered) used.add(f);
  const rest = [...reachable].filter((f) => !used.has(f));
  rest.sort();
  return { warmupFilenames: warmup, backgroundFilenames: [...backgroundOrdered, ...rest] };
}

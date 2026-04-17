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

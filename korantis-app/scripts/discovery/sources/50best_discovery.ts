import { collectExpandedMentions } from './expanded_ba_pool';

export function collect50BestDiscoveryMentions() {
  return collectExpandedMentions('50best_discovery');
}

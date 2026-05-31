import { collectExpandedMentions } from './expanded_ba_pool';

export function collectTripadvisorMentions() {
  return collectExpandedMentions('tripadvisor');
}

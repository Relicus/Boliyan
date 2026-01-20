
function getDeltaSize(viewMode: BiddingViewMode): string {
  switch (viewMode) {
    case 'modal': return 'text-lg';
    case 'spacious': return 'text-base';
    default: return 'text-sm';
  }
}

function getDeltaOffset(viewMode: BiddingViewMode): number {
  switch (viewMode) {
    case 'modal': return -50;
    case 'spacious': return -45;
    default: return -40;
  }
}

import { userFeedCode } from '../../utils/userFeed';

document.addEventListener('DOMContentLoaded', async () => {
  userFeedCode({ dataSource: 'live' });
});

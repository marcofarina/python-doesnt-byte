// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';

import InlineCode from '@site/src/components/InlineCode';
import Tooltip from '@site/src/components/Tooltip';

library.add(fab, fas);

export default {
  ...MDXComponents,
  FAIcon: FontAwesomeIcon,
  InlineCode,
  Tooltip,
};


import { authApi } from './auth.api';
import { userApi } from './user.api';
import { courseApi } from './course.api';
import { paymentApi } from './payment.api';
import { examApi } from './exam.api';
import { contentApi } from './content.api';
import { mediaApi } from './media.api';
import { settingsApi } from './settings.api';
import { logApi } from './log.api';
import { backupApi } from './backup.api';
import { lessonApi } from './lesson.api';
import { instructorApi } from './instructor.api';
import { instructorPostApi } from './instructorPost.api';
import { couponApi } from './coupon.api';

// This file acts as an aggregator for all the feature-sliced API files.
// It combines them into a single `api` object for consistent importing across the app.
export const api = {
    ...authApi,
    ...userApi,
    ...courseApi,
    ...paymentApi,
    ...examApi,
    ...contentApi,
    ...mediaApi,
    ...settingsApi,
    ...logApi,
    ...backupApi,
    ...lessonApi,
    ...instructorApi,
    ...instructorPostApi,
    ...couponApi,
};

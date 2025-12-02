import i18n from '../i18n';

export const formatBookingDate = (dateString: string): string => {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  const days = [
    i18n.t('date.days.sunday'),
    i18n.t('date.days.monday'),
    i18n.t('date.days.tuesday'),
    i18n.t('date.days.wednesday'),
    i18n.t('date.days.thursday'),
    i18n.t('date.days.friday'),
    i18n.t('date.days.saturday'),
  ];

  const months = [
    i18n.t('date.months.january'),
    i18n.t('date.months.february'),
    i18n.t('date.months.march'),
    i18n.t('date.months.april'),
    i18n.t('date.months.may'),
    i18n.t('date.months.june'),
    i18n.t('date.months.july'),
    i18n.t('date.months.august'),
    i18n.t('date.months.september'),
    i18n.t('date.months.october'),
    i18n.t('date.months.november'),
    i18n.t('date.months.december'),
  ];

  const dayName = days[dayOfWeek];
  const monthName = months[month];

  // For Arabic, use RTL format
  if (i18n.language === 'arb') {
    return `${dayName}، ${dayOfMonth} ${monthName} ${year}`;
  }

  // For Swedish and English
  return `${dayName}, ${monthName} ${dayOfMonth}, ${year}`;
};

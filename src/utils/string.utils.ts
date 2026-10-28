import { ASSETS_URL } from '@/service/config';

class StringUtils {
  static capitalize(str: string) {
    if (!str) return '';
    return str?.charAt(0).toUpperCase() + str?.slice(1);
  }

  static convertKeyToTitle(key: string) {
    if (!key) return '';
    return key
      ?.trim()
      ?.toLowerCase()
      ?.split(/[_\-]+/)
      ?.map(word => word?.charAt(0)?.toUpperCase() + word?.slice(1))
      ?.join(' ');
  }

  static limitWords(text: string, max: number = 5) {
    if (!text) return '';

    const words = text.trim().split(/\s+/);
    if (words.length <= max) return text;

    return words.slice(0, max).join(' ') + '...';
  }

  static formatKeyToTitle(key: string): string {
    return key
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  static fileNameFromUrl(url: string) {
    if (!url) return '';
    if (url.includes('file://')) return url;

    const split = url?.split('/');
    const lastWord = split?.[split?.length - 1];

    return `${ASSETS_URL}${lastWord}`;
  }

  static convertToFullUrl(url: string) {
    if (!url) return '';
    if (url.includes('file://')) return url;

    return `${ASSETS_URL}${url}`;
  }
  static addString(firstName: string = '', lastName: string = '') {
    if (!firstName || !lastName) return '';
    return `${firstName} ${lastName}`;
  }
}

export default StringUtils;

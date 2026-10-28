import { useState } from 'react';

interface PaginationResult<T> {
  data: T[];
  loading: {
    page: boolean;
    refresh: boolean;
    footer: boolean;
  };
  hasMore: boolean;
  page: number;
  initLoading: () => void;
  startRefresh: () => void;
  startLoadMore: () => boolean; // Returns true if load more should proceed
  handleSuccess: (newData: T[], isRefresh?: boolean, limit?: number) => void;
  handleError: (error: any) => void;
  setData: React.Dispatch<React.SetStateAction<T[]>>;
}

interface UsePaginationParams<T> {
  initialData?: T[];
  isPaginationEnabled?: boolean;
}

export const usePagination = <T>({
  initialData = [],
  isPaginationEnabled = true,
}: UsePaginationParams<T>): PaginationResult<T> => {
  const [data, setData] = useState<T[]>(initialData);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState({
    page: false,
    refresh: false,
    footer: false,
  });

  const initLoading = () => {
    setLoading(prev => ({ ...prev, page: true }));
    setPage(1);
    setHasMore(true);
  };

  const startRefresh = () => {
    setLoading(prev => ({ ...prev, refresh: true }));
    setPage(1);
    setHasMore(true);
  };

  const startLoadMore = (): boolean => {
    if (hasMore && !loading.page && !loading.refresh && !loading.footer) {
      setLoading(prev => ({ ...prev, footer: true }));
      return true;
    }
    return false;
  };

  const handleSuccess = (
    newData: T[],
    isRefresh: boolean = false,
    limit: number = 10,
  ) => {
    if (isRefresh || page === 1) {
      setData(newData);
      setPage(2);
    } else {
      setData(prev => [...prev, ...newData]);
      setPage(prev => prev + 1);
    }

    if (isPaginationEnabled) {
      setHasMore(newData.length >= limit);
    }

    setLoading({ page: false, refresh: false, footer: false });
  };

  const handleError = (error: any) => {
    console.log(error);
    setLoading({ page: false, refresh: false, footer: false });
  };

  return {
    data,
    loading,
    hasMore,
    page,
    initLoading,
    startRefresh,
    startLoadMore,
    handleSuccess,
    handleError,
    setData,
  };
};

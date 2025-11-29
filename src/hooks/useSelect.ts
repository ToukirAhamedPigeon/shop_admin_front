import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useDebounce } from "@/hooks/useDebounce";

type OptionType = {
  value: string;
  label: string;
  [key: string]: any;
};

type UseSelectParams = {
  apiUrl?: string;
  collection?: string;
  search: string;
  filter?: Record<string, any>;
  limit?: number;
  multiple?: boolean;
  optionValueKey?: string;
  optionLabelKeys?: string[];
  optionLabelSeparator?: string;
  initialValue?: string | string[] | { value: string; label: string } | { value: string; label: string }[];
  isOpen: boolean;
};

// 🔧 Helper to normalize initialValue to string or string[]
const normalizeInitialValue = (
  val: UseSelectParams["initialValue"]
): string | string[] | undefined => {
  if (Array.isArray(val)) {
    return val.map((v) => typeof v === "string" ? v : v?.value).filter(Boolean);
  }
  if (typeof val === "string") {
    return val;
  }
  return val?.value;
};

export function useSelect({
  apiUrl,
  collection,
  search,
  filter = {},
  limit = 50,
  multiple = false,
  optionValueKey = "_id",
  optionLabelKeys = ["name"],
  optionLabelSeparator = " ",
  initialValue,
  isOpen
}: UseSelectParams) {
  const [options, setOptions] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[] | string | null>(
    multiple ? [] : null
  );
  const debouncedSearch = useDebounce(search, 300);
  const normalizedInitialValue = normalizeInitialValue(initialValue);

  const token = typeof window !== "undefined"
    ? (() => {
        try {
          return JSON.parse(localStorage.getItem("authUser") || "{}")?.token || null;
        } catch {
          return null;
        }
      })()
    : null;

  const getOptionLabel = (item: Record<string, any>) =>
    optionLabelKeys
      .map((key) => item?.[key])
      .filter(Boolean)
      .join(optionLabelSeparator);

  const mapOption = (item: Record<string, any>): OptionType => ({
    ...item,
    value: item['value'],
    label: item['label'],
  });

  // ✅ Fetch options when search or initialValue is present
  useEffect(() => {
    if (!apiUrl) return;

    const shouldFetch = Boolean(isOpen || debouncedSearch || normalizedInitialValue);
    // console.log('isOpen',isOpen);
    // console.log('normalizedInitialValue',normalizedInitialValue);
    // console.log('debouncedSearch',debouncedSearch);
    // console.log('shouldFetch',shouldFetch);
    if (!shouldFetch) return;

    const fetchOptions = async () => {
      setLoading(true);
      try {
        const where = debouncedSearch
          ? {
              $or: optionLabelKeys.map((key) => ({
                [key]: { $regex: debouncedSearch, $options: "i" },
              })),
              ...filter,
            }
          : normalizedInitialValue && !isOpen
          ? {
              [optionValueKey]: {
                $in: Array.isArray(normalizedInitialValue)
                  ? normalizedInitialValue
                  : [normalizedInitialValue],
              },
              ...filter,
            }
          : filter;

        const res = await api.post(
          apiUrl,
          {
            collection,
            labelFields: optionLabelKeys,
            valueFields: [optionValueKey],
            label_con_str: optionLabelSeparator,
            where,
            limit,
            skip: 0,
            sortBy: optionLabelKeys[0],
            sortOrder: "asc",
          },
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : undefined,
          }
        );

        // console.log('res.data',res.data);

        const mapped = (res.data || []).map(mapOption);

        // console.log('mapped',mapped);

        setOptions((prev) => {
          const all = [...prev, ...mapped];
          const seen = new Set();
          return all.filter((opt) => {
            if (seen.has(opt.value)) return false;
            seen.add(opt.value);
            return true;
          });
        });
      } catch (err) {
        console.error("useSelect: Failed to fetch options", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [isOpen,debouncedSearch, JSON.stringify(filter), apiUrl, JSON.stringify(normalizedInitialValue)]);

  // ✅ Pre-select initial value(s)
  useEffect(() => {
    if (!normalizedInitialValue) return;
    setSelected(normalizedInitialValue);
  }, [JSON.stringify(normalizedInitialValue)]);

  return {
    options,
    loading,
    selected,
    setSelected,
    getOptionLabel,
    setOptions,
  };
}

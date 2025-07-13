import { useQuery } from "@tanstack/react-query";

export function useGetSpecificGoogleFont(fontUrl: string) {
  return useQuery<ArrayBuffer, Error, ArrayBuffer>({
    queryKey: ["google-font", fontUrl],
    queryFn: () => fetch(fontUrl).then((res) => res.arrayBuffer()),
  });
}

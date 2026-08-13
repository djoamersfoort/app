import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { File } from "expo-file-system";
import type { ImagePickerAsset } from "expo-image-picker";
import {
  Album,
  AlbumList,
  Api,
  HttpResponse,
  User as MediaUser,
} from "../__generated__/media";
import {
  createFetch,
  request,
  segment,
  UPLOAD_TIMEOUT_MS,
} from "../api/client";
import { HttpError } from "../api/errors";
import { keys, useScope } from "../api/keys";
import { Authed, useAuth, useTokenProvider } from "../auth";

const MEDIA_BASE = "https://media.djoamersfoort.nl/api";

/**
 * The generated client does its own status handling and throws the raw
 * response object. Normalise that into the same error types as the rest of the
 * app so retry rules and error messages behave consistently.
 */
async function call<T>(
  run: () => Promise<HttpResponse<T, unknown>>,
): Promise<T> {
  try {
    return (await run()).data;
  } catch (error) {
    // Errors raised by our own fetch wrapper (network, timeout, blocked) are
    // already the right shape.
    if (error instanceof Error) throw error;

    const response = error as {
      status?: number;
      url?: string;
      error?: unknown;
    };
    if (typeof response?.status === "number") {
      const detail = response.error;
      const message =
        detail && typeof detail === "object" && "detail" in detail
          ? String((detail as { detail: unknown }).detail)
          : undefined;
      throw new HttpError(
        response.status,
        response.url || MEDIA_BASE,
        "",
        message,
      );
    }

    throw new Error("Unexpected media API failure");
  }
}

function useMediaApi() {
  const token = useTokenProvider();

  return useMemo(() => {
    if (!token) return null;
    return new Api({
      baseUrl: MEDIA_BASE,
      customFetch: createFetch({ auth: token }),
    });
  }, [token]);
}

export function useAlbums() {
  const api = useMediaApi();
  const scope = useScope();

  return useQuery({
    queryKey: keys.albums(scope),
    enabled: !!api,
    queryFn: async ({ signal }): Promise<AlbumList[]> => {
      const albums = await call(() => api!.albums.getAlbums({ signal }));
      // Sort a copy so the cached array is never reordered in place.
      return [...(albums ?? [])].sort((a, b) => a.order - b.order);
    },
  });
}

export function useAlbum(album: string) {
  const api = useMediaApi();
  const scope = useScope();

  return useQuery({
    queryKey: keys.album(scope, album),
    enabled: !!api && !!album,
    queryFn: ({ signal }) =>
      call(() => api!.albums.getAlbum(album, { signal })),
  });
}

export function useMediaUser() {
  const api = useMediaApi();
  const auth = useAuth();
  const scope = useScope();

  return useQuery({
    queryKey: keys.mediaUser(scope),
    enabled: !!api && auth.authenticated === Authed.AUTHENTICATED,
    staleTime: 10 * 60_000,
    queryFn: ({ signal }): Promise<MediaUser> =>
      call(() => api!.users.getUser({ signal })),
  });
}

export function useUploadItems(album: string) {
  const token = useTokenProvider();
  const queryClient = useQueryClient();
  const scope = useScope();

  return useMutation({
    mutationFn: async (assets: ImagePickerAsset[]) => {
      if (!token) return;

      const body = new FormData();
      assets.forEach((asset) => body.append("items", new File(asset.uri)));

      // Uploads carry real payloads over mobile connections, so they get a far
      // longer budget than the default request timeout.
      await request(`${MEDIA_BASE}/items/${segment(album)}`, {
        method: "POST",
        auth: token,
        body,
        timeout: UPLOAD_TIMEOUT_MS,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.album(scope, album) });
      queryClient.invalidateQueries({ queryKey: keys.albums(scope) });
    },
  });
}

export function useDeleteItem(album: string) {
  const api = useMediaApi();
  const queryClient = useQueryClient();
  const scope = useScope();

  return useMutation({
    mutationFn: async (item: string): Promise<Album | undefined> => {
      if (!api) return;
      return call(() => api.items.deleteItems(album, [item]));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.album(scope, album) });
      queryClient.invalidateQueries({ queryKey: keys.albums(scope) });
    },
  });
}

export function useSetPreview(album: string) {
  const api = useMediaApi();
  const queryClient = useQueryClient();
  const scope = useScope();

  return useMutation({
    mutationFn: async (item: string): Promise<Album | undefined> => {
      if (!api) return;
      return call(() => api.albums.setPreview(album, { item_id: item }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.albums(scope) });
    },
  });
}

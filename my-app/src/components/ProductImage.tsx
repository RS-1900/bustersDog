import { useState } from "react";
import { Image, type ImageProps } from "expo-image";
import { imageUrl } from "../services/config";
export function ProductImage({
  uri,
  ...props
}: Omit<ImageProps, "source"> & { uri: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const url = imageUrl(uri);
  return (
    <Image
      {...props}
      source={
        url && failed !== uri
          ? { uri: url }
          : require("../../assets/buster.png")
      }
      contentFit="cover"
      onError={() => setFailed(uri)}
    />
  );
}

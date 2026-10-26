
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export default function EditProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateUsername = (value: string) => {
    const regex = /^[a-zA-Z0-9_]+$/;

    if (!value) return "El nombre de usuario es requerido";
    if (value.length < 3) return "Mínimo 3 caracteres";
    if (value.length > 20) return "Máximo 20 caracteres";
    if (!regex.test(value)) {
      return "Solo letras, números y guión bajo";
    }

    return "";
  };

  const handleUsernameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value.toLowerCase();
    setUsername(value);
    setUsernameError(validateUsername(value));
  };

  const checkUsernameAvailable = async (
    newUsername: string,
    currentUserId: string
  ): Promise<boolean> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", newUsername)
      .neq("id", currentUserId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Error al comprobar nombre de usuario: ${error.message}`
      );
    }

    return !data;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          setMessage({
            type: "error",
            text: "No hay sesión activa. Inicia sesión nuevamente.",
          });
          return;
        }

        const { data: profileData, error: profileError } =
          await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) throw profileError;

        const currentProfile: Profile = profileData
          ? {
              id: profileData.id,
              username: profileData.username || "",
              avatar_url: profileData.avatar_url || null,
            }
          : {
              id: user.id,
              username: user.user_metadata?.username || "",
              avatar_url: null,
            };

        setProfile(currentProfile);
        setUsername(currentProfile.username);
        setOriginalUsername(currentProfile.username);

        if (currentProfile.avatar_url) {
          setAvatarPreview(currentProfile.avatar_url);
        }
      } catch (err) {
        console.error("Error al cargar perfil:", err);
        setMessage({
          type: "error",
          text:
            err instanceof Error
              ? err.message
              : "Error al cargar perfil",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleAvatarChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Selecciona un archivo de imagen válido.",
      });
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "La imagen no debe superar los 5 MB.",
      });
      e.target.value = "";
      return;
    }

    setAvatarFile(file);
    setMessage(null);

    const reader = new FileReader();

    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!profile) return;

    const usernameValidation = validateUsername(username);

    setUsernameError(usernameValidation);

    if (usernameValidation) {
      setMessage({
        type: "error",
        text: usernameValidation,
      });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      // PASO 1: Comprobar la sesión actual
      const {
        data: { user },
        error: sessionError,
      } = await supabase.auth.getUser();

      console.log("Usuario autenticado:", user?.id);
      console.log("ID del perfil:", profile.id);

      if (sessionError) {
        throw new Error(
          `Error al verificar sesión: ${sessionError.message}`
        );
      }

      if (!user) {
        throw new Error(
          "No hay sesión autenticada. Cierra sesión e inicia sesión nuevamente."
        );
      }

      if (user.id !== profile.id) {
        throw new Error(
          "El usuario autenticado no coincide con el perfil cargado."
        );
      }

      // PASO 2: Comprobar disponibilidad del nombre
      if (username !== originalUsername) {
        const isAvailable = await checkUsernameAvailable(
          username,
          profile.id
        );

        if (!isAvailable) {
          setMessage({
            type: "error",
            text: "Este nombre de usuario ya está en uso.",
          });
          return;
        }
      }

      let avatarUrl = profile.avatar_url;

      // PASO 3: Subir imagen si se seleccionó una
      if (avatarFile) {
        const fileExt =
          avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";

        const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
        const filePath = `profile/${fileName}`;

        console.log("Bucket:", "supagram");
        console.log("Ruta de subida:", filePath);



const {
  data: { session },
  error: sessionError,
} = await supabase.auth.getSession();

console.log("Sesión disponible:", !!session);
console.log("ID de sesión:", session?.user.id);
console.log("ID del perfil:", profile.id);
console.log("Error de sesión:", sessionError?.message);
console.log("Ruta de subida:", filePath);


        const { data: uploadData, error: uploadError } =
          await supabase.storage
            .from("supagram")
            .upload(filePath, avatarFile, {
              cacheControl: "3600",
              upsert: true,
              contentType: avatarFile.type,
            });

        if (uploadError) {
          console.error("Error de Storage:", uploadError);

          throw new Error(
            `Error al subir imagen: ${uploadError.message}`
          );
        }

        console.log("Imagen subida:", uploadData.path);

        const { data: publicUrlData } = supabase.storage
          .from("supagram")
          .getPublicUrl(filePath);

        avatarUrl = publicUrlData.publicUrl;
      }

      // PASO 4: Guardar los datos del perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: profile.id,
          user_id: profile.id,
          username,
          avatar_url: avatarUrl,
        });

      if (profileError) {
        throw new Error(
          `Error al guardar perfil: ${profileError.message}`
        );
      }

      // PASO 5: Actualizar metadatos de autenticación
      const { error: authError } = await supabase.auth.updateUser({
        data: { username },
      });

      if (authError) {
        throw new Error(
          `Error al actualizar usuario: ${authError.message}`
        );
      }

      // PASO 6: Actualizar estado de la página
      setOriginalUsername(username);

      setProfile({
        ...profile,
        username,
        avatar_url: avatarUrl,
      });

      setAvatarFile(null);

      setMessage({
        type: "success",
        text: "¡Perfil actualizado!",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : String(err);

      console.error("Error al editar perfil:", err);

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/60">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Encabezado */}
      <header className="sticky top-0 z-40 bg-card-bg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/profile"
            className="text-foreground/60 hover:text-foreground"
          >
            Cancelar
          </Link>

          <h1 className="text-xl font-bold text-foreground">
            Editar perfil
          </h1>

          <button
            type="submit"
            form="edit-form"
            disabled={isSaving || !profile}
            className="text-primary font-semibold disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </header>

      {/* Formulario */}
      <main className="max-w-lg mx-auto px-4 py-8">
        <form
          id="edit-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-primary bg-card-bg">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Vista previa del avatar"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-foreground/40">
                  {username?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-primary text-sm font-semibold hover:underline"
            >
              Cambiar foto
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <span className="text-xs text-foreground/40">
              Imágenes de máximo 5 MB
            </span>
          </div>

          {/* Nombre de usuario */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="username"
              className="text-sm text-foreground/60"
            >
              Nombre de usuario
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="nombre_usuario"
              required
              minLength={3}
              maxLength={20}
              className={`w-full px-4 py-3 rounded-xl bg-card-bg border text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                usernameError ? "border-red-500" : "border-border"
              }`}
            />

            {usernameError && (
              <span className="text-red-500 text-xs">
                {usernameError}
              </span>
            )}

            <span className="text-xs text-foreground/40">
              Solo letras, números y guión bajo. Sin espacios.
            </span>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div
              role="status"
              className={`px-4 py-3 rounded-xl text-sm ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-500 border border-green-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              {message.text}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

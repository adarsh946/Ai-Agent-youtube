import { Doc, Id } from "@/convex/_generated/dataModel";
import { NavigationCreateContext } from "@/lib/NavigationProvider";
import { useRouter } from "next/navigation";
import React, { use } from "react";

function ChatRow({
  chat,
  onDelete,
}: {
  chat: Doc<"chats">;
  onDelete: (id: Id<"chats">) => void;
}) {
  const router = useRouter();
  const { closeMobileNav } = use(NavigationCreateContext);

  const handleClick = () => {
    router.push(`/dashboard/chat/${chat._id}`);
    closeMobileNav();
  };
  return <div>ChatRow</div>;
}

export default ChatRow;

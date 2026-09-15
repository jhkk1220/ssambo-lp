import { getContent } from "../lib/content";
import LandingClient from "./LandingClient";

// 서버 컴포넌트: 저장된 콘텐츠(또는 기본값)를 읽어서 클라이언트 컴포넌트에 넘겨준다.
export default async function BranchLanding({ branch }) {
  const content = await getContent(branch);
  return <LandingClient branch={branch} content={content} />;
}

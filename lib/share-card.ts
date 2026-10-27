export type CardShareResult='file'|'link';

export async function shareFileOrLink(
  file:File,
  payload:ShareData,
  share:(data:ShareData)=>Promise<void>,
  canShare?:(data:ShareData)=>boolean,
):Promise<CardShareResult> {
  const includeFile=Boolean(canShare?.({files:[file]}));
  await share(includeFile?{...payload,files:[file]}:payload);
  return includeFile?'file':'link';
}

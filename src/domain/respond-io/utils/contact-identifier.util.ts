import { ContactIdentifier } from '@respond-io/typescript-sdk';

/**
 * recipientId를 ContactIdentifier 형식으로 변환
 * 
 * @param recipientId - email, phone number, 또는 contact ID
 * @returns ContactIdentifier (email:xxx, phone:xxx, 또는 id:xxx)
 * 
 * @example
 * toContactIdentifier('user@example.com')  // 'email:user@example.com'
 * toContactIdentifier('+821012345678')     // 'phone:+821012345678'
 * toContactIdentifier('383674999')         // 'id:383674999'
 */
export function toContactIdentifier(recipientId: string): ContactIdentifier {
  // 이메일 형식 체크 (@ 포함)
  if (recipientId.includes('@')) {
    return `email:${recipientId}` as ContactIdentifier;
  }
  
  // 전화번호 형식 체크 (+ 시작만!)
  if (recipientId.startsWith('+')) {
    return `phone:${recipientId}` as ContactIdentifier;
  }
  
  // 그 외는 모두 Contact ID로 처리 (숫자 포함)
  return `id:${parseInt(recipientId)}` as ContactIdentifier;
}

export function Toast({ toast }) {
  return (
    <div className={'toast' + (toast ? ' show ' + (toast.tipo || '') : '')}>
      {toast ? toast.msg : ''}
    </div>
  )
}

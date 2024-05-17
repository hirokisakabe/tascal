type Props = {
  showAll: boolean;
  onShowLessButtonClick: () => unknown;
  onShowMoreButtonClick: () => unknown;
};

export function CalendarDayCellShowMoreOrLessButton(props: Props) {
  return props.showAll ? (
    <div className="w-full py-1 text-end text-slate-500">
      <button type="button" onClick={props.onShowLessButtonClick}>
        show less
      </button>
    </div>
  ) : (
    <div className="w-full py-1 text-end text-slate-500">
      <button type="button" onClick={props.onShowMoreButtonClick}>
        show more
      </button>
    </div>
  );
}

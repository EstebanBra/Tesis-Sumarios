type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function TextArea(props: Props) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        minHeight: 140,
        border: "1px solid #cbd5e1",
        borderRadius: 8,
        padding: 10,
        resize: "vertical",
      }}
    />
  );
}

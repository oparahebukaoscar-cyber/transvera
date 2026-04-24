// Allow unknown JSX intrinsic elements (e.g. react-three-fiber primitives)
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

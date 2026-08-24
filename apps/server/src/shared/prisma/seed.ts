async function seed(): Promise<void> {
  return;
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

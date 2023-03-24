export default interface IModel<T> {
    refetch: () => Promise<T>;
    save: () => Promise<boolean>;
    archive: () => Promise<boolean>;
}
